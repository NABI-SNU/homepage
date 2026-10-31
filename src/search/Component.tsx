'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useCallback } from 'react'
import { useSearchQueryNavigation } from '@/utilities/useSearchQueryNavigation'
import { usePathname, useSearchParams } from 'next/navigation'

export const Search: React.FC = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentQuery = searchParams.get('q')?.trim() || ''
  const otherParams = searchParams.toString()
  const buildURL = useCallback(
    (query: string) => {
      const nextParams = new URLSearchParams(otherParams)
      if (query) nextParams.set('q', query)
      else nextParams.delete('q')

      const nextQuery = nextParams.toString()
      return nextQuery ? `${pathname}?${nextQuery}` : pathname
    },
    [otherParams, pathname],
  )
  const { inputProps } = useSearchQueryNavigation({ buildURL, currentQuery })

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
        <Input id="search" placeholder="Search" {...inputProps} />
        <button type="submit" className="sr-only">
          submit
        </button>
      </form>
    </div>
  )
}
