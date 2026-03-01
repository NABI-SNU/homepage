'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/utilities/ui'

type EditOwnPostButtonProps = {
  authorPersonIDs: number[]
  postID: number
  className?: string
}

type AccountProfileResponse = {
  person?: {
    id?: number
  } | null
}

const normalizeID = (id: number): string => String(id)

export function EditOwnPostButton({ authorPersonIDs, className, postID }: EditOwnPostButtonProps) {
  const [canEdit, setCanEdit] = useState(false)
  const authorIDSet = useMemo(() => new Set(authorPersonIDs.map((id) => normalizeID(id))), [authorPersonIDs])

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/account/profile', {
          cache: 'no-store',
          credentials: 'include',
        })

        if (!response.ok) return

        const data = (await response.json()) as AccountProfileResponse
        const personID = data.person?.id
        if (personID === undefined || personID === null) return

        if (!isMounted) return
        setCanEdit(authorIDSet.has(normalizeID(personID)))
      } catch {
        if (isMounted) setCanEdit(false)
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [authorIDSet])

  if (!canEdit) return null

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
