import { getServerSideURL } from '@/utilities/getURL'

export const getUploadUrl = (
  url: string | null | undefined,
  options?: {
    cacheTag?: string | null
  },
): string => {
  if (!url) return ''

  const cacheTag = options?.cacheTag ? encodeURIComponent(options.cacheTag) : null

  const appendCacheTag = (value: string): string => {
    if (!cacheTag) return value

    const separator = value.includes('?') ? '&' : '?'
    return `${value}${separator}${cacheTag}`
  }

  if (url.startsWith('/')) {
    return appendCacheTag(`${getServerSideURL()}${url}`)
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return appendCacheTag(url)
  }

  return appendCacheTag(`${getServerSideURL()}/${url.replace(/^\/+/, '')}`)
}
