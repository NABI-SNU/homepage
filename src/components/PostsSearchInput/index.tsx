'use client'

import { useDebounce } from '@/utilities/useDebounce'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'

type Props = {
  ariaLabel?: string
  className?: string
  initialValue?: string
  pathPrefix?: string
  placeholder?: string
}

export function PostsSearchInput({
  ariaLabel = 'Search posts',
  className,
  initialValue = '',
  pathPrefix = '/posts',
  placeholder = 'Search posts',
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(initialValue)
  const [hasInteracted, setHasInteracted] = useState(false)
  const debouncedValue = useDebounce(value, 200)
  const currentQuery = useMemo(() => searchParams.get('q')?.trim() || '', [searchParams])
  const previousQueryRef = useRef(currentQuery)

  useEffect(() => {
    if (currentQuery !== value) setValue(currentQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuery])

  useEffect(() => {
    if (!hasInteracted) return

    const hasQueryChanged = previousQueryRef.current !== currentQuery
    previousQueryRef.current = currentQuery

    if (hasQueryChanged) return

    const normalizedDebouncedValue = debouncedValue.trim()
    const normalizedCurrentInputValue = value.trim()

    // Ignore stale debounced snapshots while the input is still settling.
    if (normalizedDebouncedValue !== normalizedCurrentInputValue) return

    const isAlreadyAtTarget = pathname === pathPrefix && normalizedDebouncedValue === currentQuery

    if (isAlreadyAtTarget) return

    const params = new URLSearchParams()
    if (normalizedDebouncedValue) params.set('q', normalizedDebouncedValue)
    const serializedParams = params.toString()
    const nextURL = serializedParams ? `${pathPrefix}?${serializedParams}` : pathPrefix

    window.history.replaceState(window.history.state, '', nextURL)
    startTransition(() => {
      router.replace(nextURL, { scroll: false })
    })
  }, [currentQuery, debouncedValue, hasInteracted, pathPrefix, pathname, router, value])

  return (
    <div className={className}>
      <input
        aria-label={ariaLabel}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
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
  )
}
