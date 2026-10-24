'use client'

import { useDebounce } from '@/utilities/useDebounce'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

type Props = {
  ariaLabel?: string
  basePath?: string
  className?: string
  placeholder?: string
  searchPath?: string
}

const inputClassName =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground'

// Shown while the page is prerendered: the list pages are static, so the search box hydrates later.
export const PostsSearchInputFallback = ({
  ariaLabel = 'Search posts',
  className,
  placeholder = 'Search posts',
}: Pick<Props, 'ariaLabel' | 'className' | 'placeholder'>) => (
  <div className={className}>
    <input
      aria-label={ariaLabel}
      className={inputClassName}
      placeholder={placeholder}
      type="text"
    />
  </div>
)

/**
 * Search lives on its own dynamic route (`searchPath`) so `/posts` and its pages can be
 * prerendered. The input sits in a shared layout, so it keeps focus while the route changes.
 */
export function PostsSearchInput({
  ariaLabel = 'Search posts',
  basePath = '/posts',
  className,
  placeholder = 'Search posts',
  searchPath = '/posts/search',
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const currentQuery = pathname === searchPath ? searchParams.get('q')?.trim() || '' : ''
  const [value, setValue] = useState(currentQuery)
  const [hasInteracted, setHasInteracted] = useState(false)
  const debouncedValue = useDebounce(value, 200)
  const previousQueryRef = useRef(currentQuery)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirror the URL on back/forward
    if (currentQuery !== value) setValue(currentQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuery])

  useEffect(() => {
    if (!hasInteracted) return

    const hasQueryChanged = previousQueryRef.current !== currentQuery
    previousQueryRef.current = currentQuery

    if (hasQueryChanged) return

    const normalizedDebouncedValue = debouncedValue.trim()

    // Ignore stale debounced snapshots while the input is still settling.
    if (normalizedDebouncedValue !== value.trim()) return
    if (normalizedDebouncedValue === currentQuery) return

    const nextURL = normalizedDebouncedValue
      ? `${searchPath}?${new URLSearchParams({ q: normalizedDebouncedValue }).toString()}`
      : basePath

    window.history.replaceState(window.history.state, '', nextURL)
    startTransition(() => {
      router.replace(nextURL, { scroll: false })
    })
  }, [basePath, currentQuery, debouncedValue, hasInteracted, router, searchPath, value])

  return (
    <>
      <div className={className}>
        <input
          aria-label={ariaLabel}
          className={inputClassName}
          name="q"
          onChange={(event) => {
            setHasInteracted(true)
            setValue(event.target.value)
          }}
          placeholder={placeholder}
          type="text"
          value={value}
        />
      </div>
      {currentQuery && (
        <Link
          href={basePath}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
        >
          Clear search
        </Link>
      )}
    </>
  )
}
