import { getPayload, type Payload } from 'payload'

import type { NextRequest } from 'next/server'

import configPromise from '@payload-config'
import { getBetterAuthUserFromHeaders } from '@/auth/getBetterAuthUserFromHeaders'
import { strictPayloadSessionResolutionOptions } from '@/auth/payloadSessionPolicy'
import { resolvePayloadUserFromSession } from '@/auth/resolvePayloadUserFromSession'
import type { Person, Post, User, Wiki } from '@/payload-types'

type LinkedPersonSummary = {
  avatar?: Person['avatar']
  id: number
  name?: string | null
  slug?: string | null
}

type AccountItemStatus = 'draft' | 'published'

type AccountDashboardItem = {
  editURL: string
  id: number
  slug: string
  status: AccountItemStatus
  title: string
  updatedAt?: string | null
  viewURL: string
}

type AccountPermissions = {
  canAccessAdmin: boolean
  canCreatePost: boolean
  canCreateWiki: boolean
  canPublishOwnPosts: boolean
  canPublishOwnWiki: boolean
}

export type AccountCapabilities = {
  linkedPerson: LinkedPersonSummary | null
  permissions: AccountPermissions
  user: {
    id: number
    name?: string | null
    roles?: string | string[] | null
  } | null
}

export type AccountDashboardData = AccountCapabilities & {
  actions: {
    adminURL?: string
    notionURL?: string
    postCreateURL?: string
    profileEditURL: string
    profileURL?: string
    wikiCreateURL?: string
  }
  recentPosts: AccountDashboardItem[]
  recentWiki: AccountDashboardItem[]
}

type AccountRequestContext = {
  linkedPerson: LinkedPersonSummary | null
  payload: Payload
  permissions: AccountPermissions
  responseHeaders: Headers
  user: User
}

const ACCOUNT_CACHE_CONTROL = 'private, no-store, no-cache, max-age=0, must-revalidate'
const NOTION_HEADQUARTERS_URL =
  'https://www.notion.so/Headquarters-314d4da6497980c08811f9b4b952006b?source=copy_link'

const buildPrivateResponseHeaders = (responseHeaders?: Headers): Headers => {
  const headers = new Headers(responseHeaders)
  headers.set('Cache-Control', ACCOUNT_CACHE_CONTROL)
  headers.set('Vary', 'Cookie')
  return headers
}

const toLinkedPersonSummary = (
  person?: Partial<LinkedPersonSummary> | null,
): LinkedPersonSummary | null => {
  if (!person || typeof person.id !== 'number') return null

  return {
    avatar: person.avatar,
    id: person.id,
    name: person.name || null,
    slug: person.slug || null,
  }
}

const getLinkedPerson = async ({
  payload,
  user,
}: {
  payload: Payload
  user: User
}): Promise<LinkedPersonSummary | null> => {
  const people = await payload.find({
    collection: 'people',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    select: {
      avatar: true,
      id: true,
      name: true,
      slug: true,
    },
    user,
    where: {
      user: {
        equals: user.id,
      },
    },
  })

  return toLinkedPersonSummary(people.docs[0] as Partial<LinkedPersonSummary> | undefined)
}

const buildPermissions = ({
  linkedPerson,
}: {
  linkedPerson: LinkedPersonSummary | null
}): AccountPermissions => {
  const canCreatePost = Boolean(linkedPerson)

  return {
    canAccessAdmin: true,
    canCreatePost,
    canCreateWiki: true,
    canPublishOwnPosts: canCreatePost,
    canPublishOwnWiki: true,
  }
}

const normalizeStatus = (value: unknown): AccountItemStatus => {
  return value === 'published' ? 'published' : 'draft'
}

const mapPostItem = (
  post: Pick<Post, 'id' | 'slug' | 'title' | 'updatedAt'> & { _status?: unknown },
): AccountDashboardItem => ({
  editURL: `/admin/collections/posts/${post.id}`,
  id: post.id,
  slug: String(post.slug || ''),
  status: normalizeStatus(post._status),
  title: String(post.title || 'Untitled post'),
  updatedAt: post.updatedAt || null,
  viewURL: `/posts/${encodeURIComponent(String(post.slug || ''))}`,
})

const mapWikiItem = (
  wiki: Pick<Wiki, 'id' | 'slug' | 'title' | 'updatedAt'> & { _status?: unknown },
): AccountDashboardItem => ({
  editURL: `/admin/collections/wiki/${wiki.id}`,
  id: wiki.id,
  slug: String(wiki.slug || ''),
  status: normalizeStatus(wiki._status),
  title: String(wiki.title || 'Untitled wiki page'),
  updatedAt: wiki.updatedAt || null,
  viewURL: `/wiki/${encodeURIComponent(String(wiki.slug || ''))}`,
})

export const resolveAccountRequestContext = async (
  req: NextRequest,
): Promise<
  | {
      responseHeaders: Headers
      user: null
    }
  | AccountRequestContext
> => {
  const payload = await getPayload({ config: configPromise })
  const { betterAuthUser, responseHeaders } = await getBetterAuthUserFromHeaders(req.headers)
  const user = await resolvePayloadUserFromSession({
    payload,
    betterAuthUser,
    ...strictPayloadSessionResolutionOptions,
  })

  if (!user) {
    return {
      responseHeaders: buildPrivateResponseHeaders(responseHeaders),
      user: null,
    }
  }

  const linkedPerson = await getLinkedPerson({ payload, user })
  const permissions = buildPermissions({ linkedPerson })

  return {
    linkedPerson,
    payload,
    permissions,
    responseHeaders: buildPrivateResponseHeaders(responseHeaders),
    user,
  }
}

export const buildAccountCapabilities = ({
  linkedPerson,
  permissions,
  user,
}: {
  linkedPerson: LinkedPersonSummary | null
  permissions: AccountPermissions
  user: User
}): AccountCapabilities => ({
  linkedPerson,
  permissions,
  user: {
    id: user.id,
    name: user.name || null,
    roles: user.roles ?? null,
  },
})

export const getAccountDashboardData = async ({
  linkedPerson,
  payload,
  permissions,
  user,
}: AccountRequestContext): Promise<AccountDashboardData> => {
  const recentPostsPromise = linkedPerson
    ? payload.find({
        collection: 'posts',
        depth: 0,
        limit: 5,
        overrideAccess: false,
        pagination: false,
        select: {
          id: true,
          slug: true,
          title: true,
          updatedAt: true,
          _status: true,
        },
        sort: '-updatedAt',
        user,
        where: {
          authors: {
            contains: linkedPerson.id,
          },
        },
      })
    : Promise.resolve({
        docs: [] as Array<
          Pick<Post, 'id' | 'slug' | 'title' | 'updatedAt'> & { _status?: unknown }
        >,
      })

  const recentWikiPromise = payload.find({
    collection: 'wiki',
    depth: 0,
    limit: 5,
    overrideAccess: false,
    pagination: false,
    select: {
      id: true,
      slug: true,
      title: true,
      updatedAt: true,
      _status: true,
    },
    sort: '-updatedAt',
    user,
    where: {
      createdBy: {
        equals: user.id,
      },
    },
  })

  const [recentPostsResult, recentWikiResult] = await Promise.all([
    recentPostsPromise,
    recentWikiPromise,
  ])
  const capabilities = buildAccountCapabilities({ linkedPerson, permissions, user })

  return {
    ...capabilities,
    actions: {
      ...(permissions.canAccessAdmin ? { adminURL: '/admin' } : {}),
      notionURL: NOTION_HEADQUARTERS_URL,
      ...(permissions.canCreatePost ? { postCreateURL: '/admin/collections/posts/create' } : {}),
      profileEditURL: '/account/profile',
      ...(linkedPerson?.slug
        ? { profileURL: `/people/${encodeURIComponent(linkedPerson.slug)}` }
        : {}),
      ...(permissions.canCreateWiki ? { wikiCreateURL: '/admin/collections/wiki/create' } : {}),
    },
    recentPosts: recentPostsResult.docs
      .filter((post) => Boolean(post?.id && post?.slug))
      .map((post) =>
        mapPostItem(
          post as Pick<Post, 'id' | 'slug' | 'title' | 'updatedAt'> & { _status?: unknown },
        ),
      ),
    recentWiki: recentWikiResult.docs
      .filter((wiki) => Boolean(wiki?.id && wiki?.slug))
      .map((wiki) =>
        mapWikiItem(
          wiki as Pick<Wiki, 'id' | 'slug' | 'title' | 'updatedAt'> & { _status?: unknown },
        ),
      ),
    user: {
      id: user.id,
      name: user.name || null,
      roles: user.roles ?? null,
    },
  }
}

export const privateAccountResponse = (body: unknown, init?: ResponseInit): Response => {
  const headers = buildPrivateResponseHeaders(
    init?.headers instanceof Headers ? init.headers : new Headers(init?.headers),
  )
  return Response.json(body, {
    ...init,
    headers,
  })
}
