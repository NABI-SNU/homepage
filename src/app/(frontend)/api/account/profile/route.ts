import type { File as PayloadFile } from 'payload'
import sharp from 'sharp'

import { NextRequest } from 'next/server'

import { privateAccountResponse, resolveAccountRequestContext } from '@/utilities/accountAccess'

/**
 * The fields a member may change on their own profile. Everything else on the user record
 * (email, roles, approval, visibility, role assignments) stays admin-only; the collection's own
 * update access is admin-only, so this whitelist is the only self-service write path.
 */
const editableProfileFields = ['name', 'bio', 'research', 'socials', 'avatar', 'years'] as const
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024
const SAFE_AVATAR_FORMATS = new Set(['jpeg', 'png', 'webp'])
const SAFE_AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const SOCIAL_PLATFORMS = new Set(['x', 'github', 'linkedin', 'orcid', 'website'])

const profileSelect = {
  avatar: true,
  bio: true,
  email: true,
  id: true,
  name: true,
  research: true,
  roleAssignments: true,
  slug: true,
  socials: true,
  years: true,
} as const

const parseYearsInput = (value: unknown): number[] | null => {
  const rawValues = Array.isArray(value)
    ? value
    : String(value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

  const normalized = Array.from(
    new Set(
      rawValues
        .map((item) => (typeof item === 'number' ? item : Number(item)))
        .filter((item) => Number.isInteger(item) && item >= 1900 && item <= 2100),
    ),
  ).sort((a, b) => b - a)

  return normalized.length > 0 ? normalized : null
}

const parseResearchInput = (value: unknown): string[] => {
  const rawValues = Array.isArray(value) ? value : String(value ?? '').split(',')
  return Array.from(
    new Set(
      rawValues
        .map((item) => String(item ?? '').trim())
        .filter((item) => item.length > 0 && item.length <= 120),
    ),
  )
}

const parseSocialsInput = (
  value: unknown,
): Array<{ label?: string; platform: string; url: string }> => {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const { label, platform, url } = item as Record<string, unknown>
    if (typeof platform !== 'string' || !SOCIAL_PLATFORMS.has(platform)) return []
    if (typeof url !== 'string') return []

    try {
      const parsed = new URL(url.trim())
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return []
      return [
        {
          platform,
          url: parsed.toString(),
          ...(typeof label === 'string' && label.trim()
            ? { label: label.trim().slice(0, 80) }
            : {}),
        },
      ]
    } catch {
      return []
    }
  })
}

type EditableProfileField = (typeof editableProfileFields)[number]

export async function GET(req: NextRequest): Promise<Response> {
  const context = await resolveAccountRequestContext(req)

  if (!context.user) {
    return privateAccountResponse(
      { error: 'Unauthorized' },
      { headers: context.responseHeaders, status: 401 },
    )
  }

  const { payload, responseHeaders, user } = context

  const profile = await payload.findByID({
    collection: 'users',
    id: user.id,
    depth: 1,
    overrideAccess: false,
    select: profileSelect,
    user,
  })

  return privateAccountResponse(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roles: user.roles,
      },
      // Kept under the historical `person` key so the account UI keeps working.
      person: profile,
    },
    { headers: responseHeaders },
  )
}

export async function PATCH(req: NextRequest): Promise<Response> {
  const context = await resolveAccountRequestContext(req)

  if (!context.user) {
    return privateAccountResponse(
      { error: 'Unauthorized' },
      { headers: context.responseHeaders, status: 401 },
    )
  }

  const { payload, responseHeaders, user } = context

  const contentType = req.headers.get('content-type') || ''
  let avatarUpload: File | null = null
  const updateData: Record<string, unknown> = {}

  const applyField = (key: EditableProfileField, value: unknown) => {
    if (key === 'avatar') {
      if (value === null) updateData.avatar = null
      return
    }
    if (key === 'years') {
      updateData.years = parseYearsInput(value)
      return
    }
    if (key === 'research') {
      updateData.research = parseResearchInput(value)
      return
    }
    if (key === 'socials') {
      updateData.socials = parseSocialsInput(value)
      return
    }
    if (key === 'name') {
      const name = String(value ?? '').trim()
      if (name) updateData.name = name.slice(0, 120)
      return
    }
    updateData[key] = String(value ?? '').slice(0, 4000)
  }

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const maybeAvatar = formData.get('avatar')
    avatarUpload = maybeAvatar instanceof File && maybeAvatar.size > 0 ? maybeAvatar : null

    const removeAvatar = String(formData.get('removeAvatar') || '').toLowerCase() === 'true'

    for (const key of editableProfileFields) {
      if (key === 'avatar' || key === 'socials') continue
      const value = formData.get(key)
      if (value === null) continue
      applyField(key, value)
    }

    if (removeAvatar) {
      updateData.avatar = null
    }
  } else {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    for (const key of editableProfileFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        applyField(key, body[key])
      }
    }
  }

  if (!avatarUpload && Object.keys(updateData).length === 0) {
    return privateAccountResponse({ error: 'No editable fields provided' }, { status: 400 })
  }

  if (avatarUpload) {
    if (!SAFE_AVATAR_MIME_TYPES.has(avatarUpload.type)) {
      return privateAccountResponse(
        { error: 'Avatar must be a PNG, JPEG, or WebP image.' },
        { status: 400 },
      )
    }

    if (avatarUpload.size > MAX_AVATAR_SIZE_BYTES) {
      return privateAccountResponse(
        { error: 'Avatar image must be 5MB or smaller.' },
        { status: 400 },
      )
    }

    const arrayBuffer = await avatarUpload.arrayBuffer()
    const avatarBuffer = Buffer.from(arrayBuffer)
    const metadata = await sharp(avatarBuffer, { animated: false })
      .metadata()
      .catch(() => null)

    if (!metadata?.format || !SAFE_AVATAR_FORMATS.has(metadata.format)) {
      return privateAccountResponse(
        { error: 'Avatar must be a PNG, JPEG, or WebP image.' },
        { status: 400 },
      )
    }

    const safeBaseName = (avatarUpload.name || `avatar-${user.id}`)
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
    const normalizedFormat = metadata.format === 'jpeg' ? 'jpg' : metadata.format
    const filename = `${safeBaseName || `avatar-${user.id}`}.${normalizedFormat}`
    const file: PayloadFile = {
      name: filename,
      data: avatarBuffer,
      mimetype: metadata.format === 'jpeg' ? 'image/jpeg' : `image/${metadata.format}`,
      size: avatarUpload.size,
    }

    const uploadedAvatar = await payload.create({
      collection: 'media',
      data: {
        alt: `${user.name || 'User'} avatar`,
      },
      file,
      overrideAccess: true,
    })

    updateData.avatar = uploadedAvatar.id
  }

  // Collection updates are admin-only; this route is the one self-service path and only ever
  // writes the whitelisted fields above, so the access bypass is intentional and bounded.
  // No `select` here: the Users afterChange hooks compare the full document with the previous
  // one, and a partial document would read as "fields removed".
  await payload.update({
    collection: 'users',
    id: user.id,
    data: updateData,
    depth: 0,
    overrideAccess: true,
  })

  const updated = await payload.findByID({
    collection: 'users',
    id: user.id,
    depth: 1,
    overrideAccess: true,
    select: profileSelect,
  })

  return privateAccountResponse({ person: updated }, { headers: responseHeaders })
}
