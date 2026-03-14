import { Button, type ButtonProps } from '@/components/ui/button'
import { getActivityPathFromReferenceValue } from '@/utilities/activityURL'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React from 'react'

import type { Activity, Announcement, News, Person, Post, Research, Wiki } from '@/payload-types'

type CMSLinkType = {
  appearance?: 'inline' | ButtonProps['variant']
  children?: React.ReactNode
  className?: string
  label?: string | null
  newTab?: boolean | null
  reference?: {
    relationTo: 'posts' | 'people' | 'news' | 'research' | 'wiki' | 'activities' | 'announcements'
    value: Post | Person | News | Research | Wiki | Activity | Announcement | string | number
  } | null
  size?: ButtonProps['size'] | null
  type?: 'custom' | 'reference' | null
  url?: string | null
}

export const CMSLink: React.FC<CMSLinkType> = (props) => {
  const {
    type,
    appearance = 'inline',
    children,
    className,
    label,
    newTab,
    reference,
    size: sizeFromProps,
    url,
  } = props

  const href =
    type === 'reference' && typeof reference?.value === 'object' && reference.value.slug
      ? reference?.relationTo === 'research'
        ? `/labs/${reference.value.slug}`
        : reference?.relationTo === 'announcements'
          ? `/announcements/${reference.value.slug}`
          : reference?.relationTo === 'wiki'
            ? `/wiki/${reference.value.slug}`
            : reference?.relationTo === 'activities'
              ? getActivityPathFromReferenceValue(reference.value)
              : `/${reference?.relationTo}/${reference.value.slug}`
      : url

  if (!href) return null

  const size = appearance === 'link' ? 'clear' : sizeFromProps
  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}

  /* Ensure we don't break any styles set by richText */
  if (appearance === 'inline') {
    return (
      <Link className={cn(className)} href={href || url || ''} {...newTabProps}>
        {label}
        {children}
      </Link>
    )
  }

  return (
    <Button asChild className={className} size={size} variant={appearance}>
      <Link className={cn(className)} href={href || url || ''} {...newTabProps}>
        {label}
        {children}
      </Link>
    </Button>
  )
}
