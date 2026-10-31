export const ACTIVITY_TYPES = ['symposium', 'conference', 'seminar', 'topic-review'] as const

export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export type ActivityLike = {
  activityType?: ActivityType | null
  slug?: string | null
}

/** Base path of each activity type's pages. The symposium index is a page of its own. */
export const ACTIVITY_BASE_PATHS: Record<ActivityType, string> = {
  symposium: '/symposium',
  conference: '/conferences',
  seminar: '/seminars',
  'topic-review': '/topic-reviews',
}

export const isActivityType = (value: unknown): value is ActivityType =>
  typeof value === 'string' && (ACTIVITY_TYPES as readonly string[]).includes(value)

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

  const basePath = ACTIVITY_BASE_PATHS[isActivityType(activityType) ? activityType : 'conference']
  return `${basePath}/${encodeSlug(slug)}`
}

export const getActivityPathFromReferenceValue = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') return null

  const slug = 'slug' in value && typeof value.slug === 'string' ? value.slug : null
  const activityType =
    'activityType' in value && isActivityType(value.activityType) ? value.activityType : null

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
  const basePath = ACTIVITY_BASE_PATHS[isActivityType(activityType) ? activityType : 'conference']
  const path = encodedSlug ? `${basePath}/${encodedSlug}` : basePath

  const encodedParams = new URLSearchParams({
    collection: 'activities',
    path,
    ...(slug ? { slug } : {}),
  })

  return `/next/preview?${encodedParams.toString()}`
}
