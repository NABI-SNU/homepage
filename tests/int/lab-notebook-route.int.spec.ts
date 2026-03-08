import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { draftMode, findResearchBySlug, getPayload, resolvePayloadUserFromHeaders } = vi.hoisted(
  () => ({
    draftMode: vi.fn(),
    findResearchBySlug: vi.fn(),
    getPayload: vi.fn(),
    resolvePayloadUserFromHeaders: vi.fn(),
  }),
)

vi.mock('payload', () => ({
  getPayload,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('next/headers', () => ({
  draftMode,
}))

vi.mock('@/auth/resolvePayloadUserFromHeaders', () => ({
  resolvePayloadUserFromHeaders,
}))

vi.mock('@/utilities/getResearchBySlug', () => ({
  findResearchBySlug,
}))

import { GET } from '@/app/(frontend)/api/labs/[slug]/notebook/route'

describe('lab notebook route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())

    draftMode.mockResolvedValue({ isEnabled: false })
    getPayload.mockResolvedValue({})
    resolvePayloadUserFromHeaders.mockResolvedValue({ user: null })
  })

  it('returns notebook JSON for published research with an uploaded notebook', async () => {
    findResearchBySlug.mockResolvedValue({
      notebook: {
        url: '/notebooks/research-demo.ipynb',
      },
    })
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          cells: [],
          nbformat: 4,
          nbformat_minor: 5,
        }),
      ),
    )

    const response = await GET(new NextRequest('http://localhost:3000/api/labs/demo/notebook'), {
      params: Promise.resolve({ slug: 'demo' }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      cells: [],
      nbformat: 4,
    })
    expect(findResearchBySlug).toHaveBeenCalledWith({
      depth: 1,
      draft: false,
      payload: {},
      slug: 'demo',
      user: null,
    })
    const fetchCalls = vi.mocked(fetch).mock.calls
    expect(fetchCalls).toHaveLength(1)
    expect(fetchCalls[0]?.[0]).toMatch(/\/notebooks\/research-demo\.ipynb$/)
    expect(fetchCalls[0]?.[1]).toMatchObject({
      headers: expect.objectContaining({
        accept: expect.stringContaining('application/json'),
      }),
      next: {
        revalidate: 3600,
      },
    })
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    )
  })

  it('returns 404 when the research entry is not readable', async () => {
    findResearchBySlug.mockResolvedValue(null)

    const response = await GET(new NextRequest('http://localhost:3000/api/labs/missing/notebook'), {
      params: Promise.resolve({ slug: 'missing' }),
    })

    expect(response.status).toBe(404)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns 404 when the linked notebook relation is missing', async () => {
    findResearchBySlug.mockResolvedValue({
      notebook: null,
    })

    const response = await GET(new NextRequest('http://localhost:3000/api/labs/demo/notebook'), {
      params: Promise.resolve({ slug: 'demo' }),
    })

    expect(response.status).toBe(404)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns 404 when notebook JSON is invalid', async () => {
    findResearchBySlug.mockResolvedValue({
      notebook: {
        url: 'https://cdn.example.com/notebooks/bad.ipynb',
      },
    })
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ metadata: {} })))

    const response = await GET(new NextRequest('http://localhost:3000/api/labs/demo/notebook'), {
      params: Promise.resolve({ slug: 'demo' }),
    })

    expect(response.status).toBe(404)
  })

  it('uses the preview user context when draft mode is enabled', async () => {
    const user = {
      id: 42,
    }

    draftMode.mockResolvedValue({ isEnabled: true })
    resolvePayloadUserFromHeaders.mockResolvedValue({ user })
    findResearchBySlug.mockResolvedValue({
      notebook: {
        url: '/notebooks/preview.ipynb',
      },
    })
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          cells: [],
          nbformat: 4,
        }),
      ),
    )

    const response = await GET(new NextRequest('http://localhost:3000/api/labs/preview/notebook'), {
      params: Promise.resolve({ slug: 'preview' }),
    })

    expect(response.status).toBe(200)
    expect(resolvePayloadUserFromHeaders).toHaveBeenCalled()
    expect(findResearchBySlug).toHaveBeenCalledWith({
      depth: 1,
      draft: true,
      payload: {},
      slug: 'preview',
      user,
    })
    expect(vi.mocked(fetch).mock.calls[0]?.[1]).toMatchObject({
      cache: 'no-store',
    })
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })

  it('streams a notebook download through the protected lab route', async () => {
    findResearchBySlug.mockResolvedValue({
      notebook: {
        filename: 'research-demo.ipynb',
        url: '/notebooks/research-demo.ipynb',
      },
    })
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ cells: [], nbformat: 4 }), {
        headers: {
          'content-type': 'application/x-ipynb+json',
        },
      }),
    )

    const response = await GET(
      new NextRequest('http://localhost:3000/api/labs/demo/notebook?download=1'),
      {
        params: Promise.resolve({ slug: 'demo' }),
      },
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-disposition')).toContain('research-demo.ipynb')
    expect(response.headers.get('content-type')).toBe('application/x-ipynb+json')
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    )
    expect(await response.text()).toContain('"nbformat":4')
  })
})
