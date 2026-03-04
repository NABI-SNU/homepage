export type ActivityType = 'symposium' | 'conference'

export type ActivityLike = {
  activityType?: ActivityType | null
  slug?: string | null
}

const encodeSlug = (slug: string) => encodeURIComponent(slug)

export const getActivityPath = (activity: ActivityLike): string | null => {
  const { activityType, slug } = activity

  if (activityType === 'symposium') {
    if (slug) {
      return `/symposium/${encodeSlug(slug)}`
    }

    return '/symposium'
  }

  if (!slug) {
    return null
  }

  return `/conferences/${slug}`
}

export const getActivityPathFromReferenceValue = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') return null

  const slug = 'slug' in value && typeof value.slug === 'string' ? value.slug : null
  const activityType =
    'activityType' in value && (value.activityType === 'symposium' || value.activityType === 'conference')
      ? value.activityType
      : null

  return getActivityPath({ activityType, slug })
}

export const getActivityPreviewPath = ({
  activityType,
  slug,
}: {
  activityType?: ActivityType | null
  slug?: string | null
}): string | null => {
  const encodedSlug = slug ? encodeSlug(slug) : ''
  const path =
    activityType === 'symposium'
      ? encodedSlug
        ? `/symposium/${encodedSlug}`
        : '/symposium'
      : encodedSlug
        ? `/conferences/${encodedSlug}`
        : '/conferences'

  const encodedParams = new URLSearchParams({
    collection: 'activities',
    path,
    previewSecret: process.env.PREVIEW_SECRET || '',
    ...(encodedSlug ? { slug: encodedSlug } : {}),
  })

  return `/next/preview?${encodedParams.toString()}`
}
