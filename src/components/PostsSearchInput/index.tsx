'use client'

import { useSearchQueryNavigation } from '@/utilities/useSearchQueryNavigation'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentQuery = pathname === searchPath ? searchParams.get('q')?.trim() || '' : ''
  const buildURL = useCallback(
    (query: string) =>
      query ? `${searchPath}?${new URLSearchParams({ q: query }).toString()}` : basePath,
    [basePath, searchPath],
  )
  const { inputProps } = useSearchQueryNavigation({ buildURL, currentQuery })

  return (
    <>
      <div className={className}>
        <input
          aria-label={ariaLabel}
          className={inputClassName}
          name="q"
          placeholder={placeholder}
          type="text"
          {...inputProps}
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
