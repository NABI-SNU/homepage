import { getUploadUrl } from '@/utilities/getUploadUrl'
import { getServerSideURL } from '@/utilities/getURL'

export type NotebookContent = {
  cells: NotebookCell[]
  metadata?: Record<string, unknown>
  nbformat: number
  nbformat_minor?: number
}

type UploadLike = {
  id?: number | null
  filename?: string | null
  mimeType?: string | null
  url?: string | null
}

type HeadersLike = Pick<Headers, 'get'>

type MimeBundle = Record<string, unknown>

export type PlotlyFigure = {
  config?: Record<string, unknown>
  data?: unknown[]
  frames?: unknown[]
  layout?: Record<string, unknown>
}

export type NotebookCell =
  | {
      cell_type: 'code'
      execution_count?: number | null
      metadata?: Record<string, unknown>
      outputs?: NotebookOutput[]
      source?: string | string[]
    }
  | {
      cell_type: 'markdown' | 'raw'
      metadata?: Record<string, unknown>
      source?: string | string[]
    }

export type NotebookOutput =
  | {
      name?: string
      output_type: 'stream'
      text?: string | string[]
    }
  | {
      ename?: string
      evalue?: string
      output_type: 'error'
      traceback?: string[]
    }
  | {
      data?: MimeBundle
      execution_count?: number | null
      metadata?: Record<string, unknown>
      output_type: 'display_data' | 'execute_result'
    }

export type NotebookFile = UploadLike

export const NOTEBOOK_CACHE_CONTROL =
  'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
export const NO_STORE_CACHE_CONTROL = 'private, no-store'

export const isNotebookContent = (value: unknown): value is NotebookContent => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<NotebookContent>

  return typeof candidate.nbformat === 'number' && Array.isArray(candidate.cells)
}

export const parseNotebookContent = (value: string): NotebookContent | null => {
  try {
    const parsed = JSON.parse(value) as unknown
    return isNotebookContent(parsed) ? parsed : null
  } catch {
    return null
  }
}

export const getUploadDoc = <T extends UploadLike>(
  value: number | T | null | undefined,
): T | null => {
  if (!value || typeof value !== 'object') return null
  return value as T
}

export const getUploadID = (value: number | UploadLike | null | undefined): number | null => {
  if (typeof value === 'number') return value
  if (!value || typeof value !== 'object') return null
  return typeof value.id === 'number' ? value.id : null
}

export const normalizeNotebookText = (value: string | string[] | null | undefined): string => {
  if (Array.isArray(value)) {
    return value.join('')
  }

  return typeof value === 'string' ? value : ''
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export const getPlotlyFigure = (value: unknown): PlotlyFigure | null => {
  if (!isRecord(value)) return null

  const data = Array.isArray(value.data) ? value.data : undefined
  const frames = Array.isArray(value.frames) ? value.frames : undefined
  const layout = isRecord(value.layout) ? value.layout : undefined
  const config = isRecord(value.config) ? value.config : undefined

  if (!data && !frames && !layout) return null

  return {
    config,
    data,
    frames,
    layout,
  }
}

export const sanitizeDownloadFilename = (value: string | null | undefined): string =>
  (value || 'notebook.ipynb').replace(/[\r\n"]/g, '_')

export const getCacheControlHeader = (cacheable: boolean): string =>
  cacheable ? NOTEBOOK_CACHE_CONTROL : NO_STORE_CACHE_CONTROL

export const buildProxyHeaders = (requestHeaders: HeadersLike): HeadersInit => {
  const headers: HeadersInit = {
    accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
  }
  const cookie = requestHeaders.get('cookie')
  const authorization = requestHeaders.get('authorization')

  if (cookie) {
    headers.cookie = cookie
  }

  if (authorization) {
    headers.authorization = authorization
  }

  return headers
}

const getLegacyNotebookFetchURL = (filename: string | null | undefined): string => {
  if (typeof filename !== 'string' || !filename.trim()) {
    return ''
  }

  return `${getServerSideURL()}/api/notebooks/file/${encodeURIComponent(filename.trim())}`
}

export const getNotebookFetchURL = (
  filename: string | null | undefined,
  url: string | null | undefined,
): string => {
  const uploadURL = getUploadUrl(url)

  if (uploadURL) {
    return uploadURL
  }

  return getLegacyNotebookFetchURL(filename)
}

const getNotebookFetchURLs = (
  filename: string | null | undefined,
  url: string | null | undefined,
): string[] => {
  const urls = [getUploadUrl(url), getLegacyNotebookFetchURL(filename)].filter(Boolean)

  return Array.from(new Set(urls))
}

const fetchNotebookText = async ({
  cacheable,
  notebookURL,
  requestHeaders,
}: {
  cacheable: boolean
  notebookURL: string
  requestHeaders: HeadersLike
}): Promise<string | null> => {
  try {
    const response = await fetch(notebookURL, {
      headers: cacheable
        ? { accept: 'application/json, text/plain;q=0.9, */*;q=0.8' }
        : buildProxyHeaders(requestHeaders),
      ...(cacheable ? { next: { revalidate: 3600 } } : { cache: 'no-store' as const }),
    })

    if (!response.ok) return null

    return await response.text()
  } catch {
    return null
  }
}

export const fetchNotebookSource = async ({
  cacheable,
  filename,
  requestHeaders,
  url,
}: {
  cacheable: boolean
  filename: string | null | undefined
  requestHeaders: HeadersLike
  url: string | null | undefined
}): Promise<string | null> => {
  const notebookURLs = getNotebookFetchURLs(filename, url)

  for (const notebookURL of notebookURLs) {
    const notebookText = await fetchNotebookText({
      cacheable,
      notebookURL,
      requestHeaders,
    })

    if (notebookText) {
      return notebookText
    }
  }

  return null
}

export const fetchNotebookContent = async ({
  cacheable,
  filename,
  requestHeaders,
  url,
}: {
  cacheable: boolean
  filename: string | null | undefined
  requestHeaders: HeadersLike
  url: string | null | undefined
}): Promise<NotebookContent | null> => {
  const notebookRaw = await fetchNotebookSource({
    cacheable,
    filename,
    requestHeaders,
    url,
  })

  if (!notebookRaw) return null

  return parseNotebookContent(notebookRaw)
}
