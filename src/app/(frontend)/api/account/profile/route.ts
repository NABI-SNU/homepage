import type { File as PayloadFile } from 'payload'
import sharp from 'sharp'

import { NextRequest } from 'next/server'

import { privateAccountResponse, resolveAccountRequestContext } from '@/utilities/accountAccess'

const editableProfileFields = ['name', 'bio', 'research', 'socials', 'avatar', 'years'] as const
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024
const SAFE_AVATAR_FORMATS = new Set(['jpeg', 'png', 'webp'])
const SAFE_AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

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

  const people = await payload.find({
    collection: 'people',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      user: {
        equals: user.id,
      },
    },
  })

  return privateAccountResponse(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
      person: people.docs[0] ?? null,
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
  let updateData: Record<string, unknown> = {}

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const maybeAvatar = formData.get('avatar')
    avatarUpload = maybeAvatar instanceof File && maybeAvatar.size > 0 ? maybeAvatar : null

    const removeAvatar = String(formData.get('removeAvatar') || '').toLowerCase() === 'true'

    for (const key of editableProfileFields) {
      if (key === 'avatar') continue
      const value = formData.get(key)
      if (value === null) continue

      if (key === 'years') {
        updateData[key] = parseYearsInput(value)
        continue
      }

      if (key === 'socials') continue
      updateData[key] = String(value)
    }

    if (removeAvatar) {
      updateData.avatar = null
    }
  } else {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    updateData = editableProfileFields.reduce<Record<string, unknown>>(
      (acc, key: EditableProfileField) => {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
          acc[key] = key === 'years' ? parseYearsInput(body[key]) : body[key]
        }

        return acc
      },
      {},
    )
  }

  if (!avatarUpload && Object.keys(updateData).length === 0) {
    return privateAccountResponse({ error: 'No editable fields provided' }, { status: 400 })
  }

  const people = await payload.find({
    collection: 'people',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      user: {
        equals: user.id,
      },
    },
  })

  const person = people.docs[0]

  if (!person) {
    return privateAccountResponse({ error: 'Profile not found' }, { status: 404 })
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
        alt: `${person.name || user.name || 'User'} avatar`,
      },
      file,
      overrideAccess: true,
    })

    updateData.avatar = uploadedAvatar.id
  }

  const updated = await payload.update({
    collection: 'people',
    id: person.id,
    data: updateData,
    depth: 1,
    overrideAccess: false,
    user,
  })

  return privateAccountResponse({ person: updated }, { headers: responseHeaders })
}
