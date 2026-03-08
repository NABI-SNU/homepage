import type { NextRequest } from 'next/server'

import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'

import { resolvePayloadUserFromHeaders } from '@/auth/resolvePayloadUserFromHeaders'
import { findResearchBySlug } from '@/utilities/getResearchBySlug'
import {
  fetchNotebookContent,
  fetchNotebookSource,
  getCacheControlHeader,
  getUploadDoc,
  getUploadID,
  sanitizeDownloadFilename,
} from '@/utilities/notebooks'

type RouteContext = {
  params: Promise<{
    slug: string
  }>
}

const notFoundResponse = () => Response.json({ error: 'Notebook not found' }, { status: 404 })

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

  if (!notebook?.url && !notebook?.filename) {
    return notFoundResponse()
  }

  const cacheable = !draft && !user

  if (shouldDownload) {
    const notebookRaw = await fetchNotebookSource({
      cacheable,
      filename: notebook.filename,
      requestHeaders: req.headers,
      url: notebook.url,
    })

    if (!notebookRaw) {
      return notFoundResponse()
    }

    return new Response(notebookRaw, {
      headers: {
        'cache-control': getCacheControlHeader(cacheable),
        'content-disposition': `attachment; filename="${sanitizeDownloadFilename(notebook.filename)}"`,
        'content-type': notebook.mimeType || 'application/x-ipynb+json',
      },
    })
  }

  const notebookContent = await fetchNotebookContent({
    cacheable,
    filename: notebook.filename,
    requestHeaders: req.headers,
    url: notebook.url,
  })

  if (!notebookContent) {
    return notFoundResponse()
  }

  return Response.json(notebookContent, {
    headers: {
      'cache-control': getCacheControlHeader(cacheable),
    },
  })
}
