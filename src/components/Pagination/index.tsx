'use client'
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
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

export const Pagination: React.FC<{
  className?: string
  page: number
  pathPrefix?: string
  totalPages: number
}> = (props) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { className, page, pathPrefix = '/posts', totalPages } = props
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  const hasExtraPrevPages = page - 1 > 1
  const hasExtraNextPages = page + 1 < totalPages

  const buildHref = (targetPage: number) => {
    const basePath = targetPage === 1 ? pathPrefix : `${pathPrefix}/page/${targetPage}`
    const params = new URLSearchParams(searchParams.toString())
    const query = params.toString()
    return query ? `${basePath}?${query}` : basePath
  }

  const isTargetActive = (targetPage: number) => {
    if (targetPage === 1) return pathname === pathPrefix || pathname === `${pathPrefix}/page/1`
    return pathname === `${pathPrefix}/page/${targetPage}`
  }

  return (
    <div className={cn('my-12', className)}>
      <PaginationComponent>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={!hasPrevPage}
              onClick={() => {
                router.push(buildHref(page - 1))
              }}
            />
          </PaginationItem>

          {hasExtraPrevPages && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {hasPrevPage && (
            <PaginationItem>
              <PaginationLink
                onClick={() => {
                  router.push(buildHref(page - 1))
                }}
              >
                {page - 1}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationLink
              isActive={isTargetActive(page)}
              onClick={() => {
                router.push(buildHref(page))
              }}
            >
              {page}
            </PaginationLink>
          </PaginationItem>

          {hasNextPage && (
            <PaginationItem>
              <PaginationLink
                onClick={() => {
                  router.push(buildHref(page + 1))
                }}
              >
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
            <PaginationNext
              disabled={!hasNextPage}
              onClick={() => {
                router.push(buildHref(page + 1))
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </PaginationComponent>
    </div>
  )
}
