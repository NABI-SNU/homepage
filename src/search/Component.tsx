'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useEffect, useMemo, useState } from 'react'
import { useDebounce } from '@/utilities/useDebounce'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export const Search: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentQuery = useMemo(() => searchParams.get('q')?.trim() || '', [searchParams])
  const [value, setValue] = useState(currentQuery)

  const debouncedValue = useDebounce(value)

  useEffect(() => {
    if (currentQuery !== value) setValue(currentQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuery])

  useEffect(() => {
    const normalizedDebouncedValue = debouncedValue.trim()
    if (normalizedDebouncedValue === currentQuery) return

    const nextParams = new URLSearchParams(searchParams.toString())
    if (normalizedDebouncedValue) nextParams.set('q', normalizedDebouncedValue)
    else nextParams.delete('q')

    const nextQuery = nextParams.toString()
    const nextURL = nextQuery ? `${pathname}?${nextQuery}` : pathname

    router.replace(nextURL, { scroll: false })
  }, [currentQuery, debouncedValue, pathname, router, searchParams])

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <Input
          id="search"
          onChange={(event) => {
            setValue(event.target.value)
          }}
          placeholder="Search"
          value={value}
        />
        <button type="submit" className="sr-only">
          submit
        </button>
      </form>
    </div>
  )
}
