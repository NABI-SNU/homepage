import { getPayload } from 'payload'
import type { File as PayloadFile } from 'payload'

import { NextRequest } from 'next/server'

import configPromise from '@payload-config'
import { getBetterAuthUserFromHeaders } from '@/auth/getBetterAuthUserFromHeaders'
import { resolvePayloadUserFromSession } from '@/auth/resolvePayloadUserFromSession'

const editableProfileFields = ['name', 'bio', 'research', 'socials', 'avatar', 'joinedYear'] as const
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024

type EditableProfileField = (typeof editableProfileFields)[number]

export async function GET(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config: configPromise })
  const { betterAuthUser, responseHeaders } = await getBetterAuthUserFromHeaders(req.headers)
  const user = await resolvePayloadUserFromSession({
    payload,
    betterAuthUser,
    requireApproval: true,
    autoApproveByPeopleEmail: true,
    enforceProductionEmailVerification: true,
  })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { headers: responseHeaders, status: 401 })
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

  return Response.json(
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
  const payload = await getPayload({ config: configPromise })
  const { betterAuthUser, responseHeaders } = await getBetterAuthUserFromHeaders(req.headers)
  const user = await resolvePayloadUserFromSession({
    payload,
    betterAuthUser,
    requireApproval: true,
    autoApproveByPeopleEmail: true,
    enforceProductionEmailVerification: true,
  })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { headers: responseHeaders, status: 401 })
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

  return Response.json({ person: updated }, { headers: responseHeaders })
}
