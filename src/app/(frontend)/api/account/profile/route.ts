import { getPayload } from 'payload'
import type { File as PayloadFile } from 'payload'

import { NextRequest } from 'next/server'

import { auth } from '@/auth/betterAuth'
import configPromise from '@payload-config'

const editableProfileFields = ['name', 'bio', 'research', 'socials', 'avatar', 'joinedYear'] as const
const isProduction = process.env.NODE_ENV === 'production'
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024

type EditableProfileField = (typeof editableProfileFields)[number]

const getBetterAuthUser = async (headers: Headers) => {
  const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const sessionRequest = new Request(`${baseURL}/api/auth/get-session`, {
    method: 'GET',
    headers,
  })
  const response = await auth.handler(sessionRequest)

  if (!response.ok) return null

  const session = (await response.json().catch(() => null)) as
    | {
        user?: {
          id?: string
          email?: string
          emailVerified?: boolean
        } | null
      }
    | null

  return session?.user ?? null
}

const resolvePayloadUser = async (payload: Awaited<ReturnType<typeof getPayload>>, req: NextRequest) => {
  const betterAuthUser = await getBetterAuthUser(req.headers)
  if (!betterAuthUser?.id || !betterAuthUser.email) return null
  if (isProduction && betterAuthUser.emailVerified !== true) return null

  const normalizedEmail = betterAuthUser.email.trim().toLowerCase()

  let users = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      betterAuthUserId: {
        equals: betterAuthUser.id,
      },
    },
  })

  if (users.docs.length === 0) {
    users = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 2,
      overrideAccess: true,
      pagination: false,
      where: {
        email: {
          equals: normalizedEmail,
        },
      },
    })

    if (users.docs.length > 1) {
      payload.logger.error(`[account-profile] Duplicate payload users found for email ${normalizedEmail}`)
      return null
    }
  }

  const user = users.docs[0]
  if (!user) return null
  if (user.isApproved !== true) return null

  return user
}

export async function GET(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config: configPromise })
  const user = await resolvePayloadUser(payload, req)

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
    },
    person: people.docs[0] ?? null,
  })
}

export async function PATCH(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config: configPromise })
  const user = await resolvePayloadUser(payload, req)

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

      if (key === 'joinedYear') {
        const normalized = String(value).trim()
        updateData[key] = normalized ? Number(normalized) : null
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
    updateData = editableProfileFields.reduce<Record<string, unknown>>((acc, key: EditableProfileField) => {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        acc[key] = body[key]
      }

      return acc
    }, {})
  }

  if (!avatarUpload && Object.keys(updateData).length === 0) {
    return Response.json({ error: 'No editable fields provided' }, { status: 400 })
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
    return Response.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (avatarUpload) {
    if (!avatarUpload.type.startsWith('image/')) {
      return Response.json({ error: 'Avatar must be an image.' }, { status: 400 })
    }

    if (avatarUpload.size > MAX_AVATAR_SIZE_BYTES) {
      return Response.json({ error: 'Avatar image must be 5MB or smaller.' }, { status: 400 })
    }

    const arrayBuffer = await avatarUpload.arrayBuffer()
    const filename = (avatarUpload.name || `avatar-${user.id}.png`).replace(/[^a-zA-Z0-9._-]/g, '_')
    const file: PayloadFile = {
      name: filename,
      data: Buffer.from(arrayBuffer),
      mimetype: avatarUpload.type || 'application/octet-stream',
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

  return Response.json({ person: updated })
}
