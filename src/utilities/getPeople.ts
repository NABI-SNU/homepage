import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { postCardSelect } from '@/utilities/getPosts'
import type { Person, Post } from '@/payload-types'

type PublicPersonListItem = Pick<
  Person,
  'avatar' | 'email' | 'id' | 'name' | 'research' | 'roleAssignments' | 'slug' | 'socials' | 'years'
>

type PublicPersonDetail = Pick<
  Person,
  'avatar' | 'bio' | 'email' | 'id' | 'name' | 'research' | 'roleAssignments' | 'slug' | 'socials'
>

type AuthoredPostCard = Pick<Post, 'categories' | 'id' | 'meta' | 'slug' | 'title'>

const peopleListSelect = {
  id: true,
  name: true,
  slug: true,
  email: true,
  research: true,
  roleAssignments: true,
  socials: true,
  years: true,
  avatar: true,
} as const
const personDetailSelect = {
  id: true,
  name: true,
  slug: true,
  email: true,
  research: true,
  roleAssignments: true,
  socials: true,
  bio: true,
  avatar: true,
} as const
const personSlugSelect = {
  slug: true,
} as const
const normalizePersonSlug = (slug: string): string => slug.trim()

const getPeopleList = async (): Promise<PublicPersonListItem[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'people',
    depth: 1,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: peopleListSelect,
    sort: 'name',
  })

  return result.docs as PublicPersonListItem[]
}

const getPersonSlugs = async (): Promise<string[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'people',
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: personSlugSelect,
    sort: 'name',
  })

  return result.docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
}

const getPublicPersonBySlug = async (slug: string): Promise<PublicPersonDetail | null> => {
  const payload = await getPayload({ config: configPromise })
  const normalizedSlug = normalizePersonSlug(slug)
  const result = await payload.find({
    collection: 'people',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    select: personDetailSelect,
    where: {
      slug: {
        equals: normalizedSlug,
      },
    },
  })

  return (result.docs[0] as PublicPersonDetail | undefined) || null
}

const getAuthoredPostsByPersonID = async (personID: number): Promise<AuthoredPostCard[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 20,
    overrideAccess: false,
    pagination: false,
    select: {
      id: true,
      ...postCardSelect,
    },
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          authors: {
            contains: personID,
          },
        },
      ],
    },
  })

  return result.docs as AuthoredPostCard[]
}

export const getCachedPeopleList = () =>
  unstable_cache(getPeopleList, ['people-list'], {
    revalidate: 3600,
    tags: ['people_list'],
  })

export const getCachedPersonSlugs = () =>
  unstable_cache(getPersonSlugs, ['people-slugs'], {
    revalidate: 3600,
    tags: ['people_slugs', 'site-sitemap'],
  })

export const getCachedPublicPersonBySlug = (slug: string) => {
  const normalizedSlug = normalizePersonSlug(slug)

  return unstable_cache(
    () => getPublicPersonBySlug(normalizedSlug),
    ['person-by-slug', normalizedSlug],
    {
      revalidate: 3600,
      tags: [`person_${normalizedSlug}`],
    },
  )
}

export const getCachedAuthoredPostsByPersonID = (personID: number) =>
  unstable_cache(
    () => getAuthoredPostsByPersonID(personID),
    ['person-authored-posts', String(personID)],
    {
      revalidate: 3600,
      tags: ['person_posts'],
    },
  )
