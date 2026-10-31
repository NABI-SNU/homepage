const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/

/** Extract the video ID from a youtu.be, youtube.com/watch, /embed/ or /live/ URL (or a bare ID). */
export const getYouTubeVideoId = (value: string | null | undefined): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  if (YOUTUBE_ID.test(trimmed)) return trimmed

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\.|^m\./, '')
  let candidate: string | null = null

  if (host === 'youtu.be') {
    candidate = url.pathname.split('/')[1] || null
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') {
      candidate = url.searchParams.get('v')
    } else {
      const [, kind, id] = url.pathname.split('/')
      if (kind === 'embed' || kind === 'live' || kind === 'shorts') candidate = id || null
    }
  }

  return candidate && YOUTUBE_ID.test(candidate) ? candidate : null
}
