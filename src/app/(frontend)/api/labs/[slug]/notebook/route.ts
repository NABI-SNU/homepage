import type { NextRequest } from 'next/server'

import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'

import { resolvePayloadUserFromHeaders } from '@/auth/resolvePayloadUserFromHeaders'
import { findResearchBySlug } from '@/utilities/getResearchBySlug'
import { getUploadUrl } from '@/utilities/getUploadUrl'
import { getUploadDoc, getUploadID, parseNotebookContent } from '@/utilities/notebooks'

type RouteContext = {
  params: Promise<{
    slug: string
  }>
}

const NOTEBOOK_CACHE_CONTROL = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
const NO_STORE_CACHE_CONTROL = 'private, no-store'

const notFoundResponse = () => Response.json({ error: 'Notebook not found' }, { status: 404 })

const buildProxyHeaders = (req: NextRequest): HeadersInit => {
  const headers: HeadersInit = {
    accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
  }
  const cookie = req.headers.get('cookie')
  const authorization = req.headers.get('authorization')

  if (cookie) {
    headers.cookie = cookie
  }

  if (authorization) {
    headers.authorization = authorization
  }

  return headers
}

const sanitizeFilename = (value: string | null | undefined): string =>
  (value || 'notebook.ipynb').replace(/[\r\n"]/g, '_')

const getCacheControlHeader = (cacheable: boolean): string =>
  cacheable ? NOTEBOOK_CACHE_CONTROL : NO_STORE_CACHE_CONTROL

export async function GET(req: NextRequest, { params }: RouteContext): Promise<Response> {
  const payload = await getPayload({ config: configPromise })
  const { slug } = await params
  const { isEnabled } = await draftMode()
  const shouldDownload = req.nextUrl.searchParams.get('download') === '1'

  let draft = false
  let user = null

  if (isEnabled) {
    const resolved = await resolvePayloadUserFromHeaders({
      headers: req.headers,
      payload,
    })

    user = resolved.user
    draft = Boolean(resolved.user)
  }

  const research = await findResearchBySlug({
    depth: 1,
    draft,
    payload,
    slug,
    user,
  })

  if (!research) {
    return notFoundResponse()
  }

  const notebookID = getUploadID(research.notebook)
  const notebookFromRelationship = getUploadDoc(research.notebook)
  const notebook = notebookFromRelationship?.url
    ? notebookFromRelationship
    : notebookID
      ? await payload.findByID({
          collection: 'notebooks',
          depth: 0,
          id: notebookID,
          overrideAccess: true,
        })
      : notebookFromRelationship

  if (!notebook?.url) {
    return notFoundResponse()
  }

  const notebookURL = getUploadUrl(notebook.url)
  if (!notebookURL) {
    return notFoundResponse()
  }

  const cacheable = !draft && !user

  try {
    const notebookResponse = await fetch(notebookURL, {
      headers: cacheable
        ? { accept: 'application/json, text/plain;q=0.9, */*;q=0.8' }
        : buildProxyHeaders(req),
      ...(cacheable ? { next: { revalidate: 3600 } } : { cache: 'no-store' as const }),
    })

    if (!notebookResponse.ok) {
      return notFoundResponse()
    }

    if (shouldDownload) {
      const notebookBuffer = await notebookResponse.arrayBuffer()

      return new Response(notebookBuffer, {
        headers: {
          'cache-control': getCacheControlHeader(cacheable),
          'content-disposition': `attachment; filename="${sanitizeFilename(notebook.filename)}"`,
          'content-type':
            notebookResponse.headers.get('content-type') || 'application/x-ipynb+json',
        },
      })
    }

    const notebookRaw = await notebookResponse.text()
    const notebookContent = parseNotebookContent(notebookRaw)

    if (!notebookContent) {
      return notFoundResponse()
    }

    return Response.json(notebookContent, {
      headers: {
        'cache-control': getCacheControlHeader(cacheable),
      },
    })
  } catch {
    return notFoundResponse()
  }
}
