import {
  Pagination as PaginationComponent,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { cn } from '@/utilities/ui'
import React from 'react'

export const Pagination: React.FC<{
  className?: string
  page: number
  pathPrefix?: string
  query?: Record<string, string | undefined>
  totalPages: number
}> = (props) => {
  const { className, page, pathPrefix = '/posts', query: queryParams, totalPages } = props
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  const hasExtraPrevPages = page - 1 > 1
  const hasExtraNextPages = page + 1 < totalPages

  const buildHref = (targetPage: number) => {
    const basePath = targetPage === 1 ? pathPrefix : `${pathPrefix}/page/${targetPage}`
    const params = new URLSearchParams()
    Object.entries(queryParams || {}).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    const serializedParams = params.toString()
    return serializedParams ? `${basePath}?${serializedParams}` : basePath
  }

  return (
    <div className={cn('my-12', className)}>
      <PaginationComponent>
        <PaginationContent>
          <PaginationItem>
            {hasPrevPage ? (
              <PaginationPrevious href={buildHref(page - 1)} />
            ) : (
              <PaginationPrevious
                aria-disabled="true"
                className="pointer-events-none opacity-50"
              />
            )}
          </PaginationItem>

          {hasExtraPrevPages && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {hasPrevPage && (
            <PaginationItem>
              <PaginationLink href={buildHref(page - 1)}>
                {page - 1}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationLink href={buildHref(page)} isActive>
              {page}
            </PaginationLink>
          </PaginationItem>

          {hasNextPage && (
            <PaginationItem>
              <PaginationLink href={buildHref(page + 1)}>
                {page + 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {hasExtraNextPages && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          <PaginationItem>
            {hasNextPage ? (
              <PaginationNext href={buildHref(page + 1)} />
            ) : (
              <PaginationNext
                aria-disabled="true"
                className="pointer-events-none opacity-50"
              />
            )}
          </PaginationItem>
        </PaginationContent>
      </PaginationComponent>
    </div>
  )
}
