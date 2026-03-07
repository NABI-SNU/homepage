import { getPayload } from 'payload'

import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

import configPromise from '@payload-config'
import { resolvePayloadUserFromHeaders } from '@/auth/resolvePayloadUserFromHeaders'
import { getActivityPath } from '@/utilities/activityURL'
import {
  getPreviewTargetPath,
  previewCollectionPrefixMap,
  type PreviewableCollection,
} from '@/utilities/generatePreviewPath'

const previewableCollections = new Set<string>([
  ...Object.keys(previewCollectionPrefixMap),
  'activities',
])

const isPreviewableCollection = (
  value: string | null,
): value is PreviewableCollection | 'activities' => {
  return Boolean(value && previewableCollections.has(value))
}

export async function GET(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config: configPromise })

  const { searchParams } = new URL(req.url)

  const path = searchParams.get('path')
  const collection = searchParams.get('collection')
  const slug = searchParams.get('slug')

  if (!path || !collection || !slug) {
    return new Response('Insufficient search params', { status: 404 })
  }

  if (!path.startsWith('/')) {
    return new Response('This endpoint can only be used for relative previews', { status: 500 })
  }

  if (!isPreviewableCollection(collection)) {
    return new Response('Unsupported preview collection', { status: 400 })
  }

  try {
    const { user } = await resolvePayloadUserFromHeaders({
      headers: req.headers,
      payload,
    })

    const draft = await draftMode()

    if (!user) {
      draft.disable()
      return new Response('You are not allowed to preview this page', { status: 403 })
    }

    const result = await payload.find({
      collection,
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      user,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    const doc = result.docs[0] as
      | { activityType?: 'conference' | 'symposium' | null; slug?: string | null }
      | undefined

    if (!doc?.slug) {
      draft.disable()
      return new Response('You are not allowed to preview this page', { status: 403 })
    }

    const expectedPath =
      collection === 'activities'
        ? getActivityPath({
            activityType: doc.activityType,
            slug: doc.slug,
          })
        : getPreviewTargetPath({
            collection,
            slug: doc.slug,
          })

    if (!expectedPath || expectedPath !== path) {
      draft.disable()
      return new Response('Preview path mismatch', { status: 400 })
    }

    draft.enable()

    redirect(path)
  } catch (error) {
    payload.logger.error({ err: error }, 'Error verifying token for live preview')
    return new Response('You are not allowed to preview this page', { status: 403 })
  }
}
