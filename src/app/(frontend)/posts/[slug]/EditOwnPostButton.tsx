'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import { useAccountCapabilities } from '@/components/account/useAccountCapabilities'

import { cn } from '@/utilities/ui'

type EditOwnPostButtonProps = {
  authorPersonIDs: number[]
  postID: number
  className?: string
}

const normalizeID = (id: number): string => String(id)

export function EditOwnPostButton({ authorPersonIDs, className, postID }: EditOwnPostButtonProps) {
  const { capabilities, isResolved } = useAccountCapabilities()
  const authorIDSet = useMemo(
    () => new Set(authorPersonIDs.map((id) => normalizeID(id))),
    [authorPersonIDs],
  )
  const linkedPersonID = capabilities?.linkedPerson?.id
  const canEdit = linkedPersonID != null && authorIDSet.has(normalizeID(linkedPersonID))

  if (!isResolved || !canEdit) return null

  return (
    <Link
      className={cn(
        'inline-flex items-center rounded-full border border-[#006FFE] bg-[#006FFE] px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90',
        className,
      )}
      href={`/admin/collections/posts/${encodeURIComponent(normalizeID(postID))}`}
    >
      Edit this post
    </Link>
  )
}
