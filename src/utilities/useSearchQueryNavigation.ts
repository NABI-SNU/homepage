'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

import { useDebounce } from '@/utilities/useDebounce'

type Options = {
  /** The query currently in the URL (already trimmed). */
  currentQuery: string
  /** Builds the URL to navigate to for a (trimmed, possibly empty) query. */
  buildURL: (query: string) => string
  delay?: number
}

/**
 * Keeps a search input's text in sync with the `?q=` query in the URL.
 *
 * - Typing navigates (`router.replace`) once the value settles, never on every keystroke,
 *   and never while an IME composition (e.g. Korean input) is in progress.
 * - A navigation we started never overwrites what the user typed in the meantime: only an
 *   *external* URL change (back/forward, a hard reload) is mirrored back into the input.
 * - Exactly one router navigation per settled value. The previous implementation also called
 *   `window.history.replaceState`, which made Next run two navigations per keystroke.
 */
export function useSearchQueryNavigation({ buildURL, currentQuery, delay = 400 }: Options) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(currentQuery)
  const [isComposing, setIsComposing] = useState(false)
  const debouncedValue = useDebounce(value, delay)
  // The last query we asked the router for (or saw in the URL). Lets us tell our own
  // navigations apart from external ones.
  const lastRequestedQueryRef = useRef(currentQuery)

  useEffect(() => {
    if (currentQuery === lastRequestedQueryRef.current) return
    lastRequestedQueryRef.current = currentQuery
    setValue(currentQuery)
  }, [currentQuery])

  useEffect(() => {
    if (isComposing) return

    const nextQuery = debouncedValue.trim()

    // Ignore stale debounced snapshots while the input is still settling.
    if (nextQuery !== value.trim()) return
    if (nextQuery === lastRequestedQueryRef.current) return

    lastRequestedQueryRef.current = nextQuery
    startTransition(() => {
      router.replace(buildURL(nextQuery), { scroll: false })
    })
  }, [buildURL, debouncedValue, isComposing, router, value])

  return {
    inputProps: {
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value),
      onCompositionEnd: () => setIsComposing(false),
      onCompositionStart: () => setIsComposing(true),
      value,
    },
    value,
  }
}
