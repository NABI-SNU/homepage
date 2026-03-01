import { getClientSideURL } from '@/utilities/getURL'

/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  const appendCacheTag = (value: string): string => {
    if (!cacheTag) return value

    const separator = value.includes('?') ? '&' : '?'
    return `${value}${separator}${cacheTag}`
  }

  // Preserve root-relative URLs so they keep same-origin behavior in all environments.
  if (url.startsWith('/')) {
    return appendCacheTag(url)
  }

  // Check if URL already has http/https protocol
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return appendCacheTag(url)
  }

  // Otherwise prepend client-side URL
  const baseUrl = getClientSideURL()
  return appendCacheTag(`${baseUrl}${url}`)
}
