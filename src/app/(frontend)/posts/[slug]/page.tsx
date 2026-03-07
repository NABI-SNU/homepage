import type { Metadata } from 'next'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React, { cache } from 'react'
import RichText from '@/components/RichText'
import Link from 'next/link'

import type { Post } from '@/payload-types'

import { PostHero } from '@/heros/PostHero'
import { generateMeta } from '@/utilities/generateMeta'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { PersonAvatar } from '@/components/people/PersonAvatar'
import { TableOfContents } from '@/components/TableOfContents'
import { SocialShare } from '@/components/SocialShare'
import { getDraftAccessContext } from '@/utilities/getDraftAccessContext'
import { EditOwnPostButton } from './EditOwnPostButton'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = posts.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Post({ params: paramsPromise }: Args) {
  const { draft } = await getDraftAccessContext()
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/posts/' + decodedSlug
  const post = await queryPostBySlug({ slug: decodedSlug })

  if (!post) return <PayloadRedirects url={url} />

  const authorPersonIDs = (post.authors || []).flatMap((author) => {
    if (typeof author === 'object' && author?.id) return [author.id]
    if (typeof author === 'number') return [author]
    return []
  })

  return (
    <article className="pb-20 pt-6 md:pt-10">
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <PostHero
        post={post}
        metaAction={<EditOwnPostButton authorPersonIDs={authorPersonIDs} postID={post.id} />}
      />
      <TableOfContents />

      <div className="flex flex-col items-center gap-4 pt-10">
        <div className="container">
          <div data-post-content>
            <RichText
              className="mx-auto max-w-3xl md:prose-lg prose-headings:scroll-mt-28"
              data={post.content}
              enableGutter={false}
              enableMathJax
            />
          </div>

          {post.authors && post.authors.length > 0 && (
            <div className="mx-auto mt-8 max-w-3xl">
              <p className="text-sm text-muted-foreground">Authors</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {post.authors.map((author, index) => {
                  if (typeof author === 'object' && author?.slug) {
                    return (
                      <Link
                        key={`${author.slug}-${index}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm hover:border-primary/40 hover:bg-muted"
                        href={`/people/${author.slug}`}
                      >
                        <PersonAvatar
                          avatar={author.avatar}
                          email={author.email}
                          name={author.name || author.slug}
                          size={20}
                        />
                        {author.name || author.slug}
                      </Link>
                    )
                  }

                  return null
                })}
              </div>
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="mx-auto mt-8 max-w-3xl">
              <p className="text-sm text-muted-foreground">Topics</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {post.tags.map((tag, index) => {
                  if (typeof tag === 'object' && tag?.slug) {
                    return (
                      <Link
                        key={`${tag.slug}-${index}`}
                        className="rounded-full border border-border px-3 py-1 text-sm hover:border-primary/40 hover:bg-muted"
                        href={`/topics/${tag.slug}`}
                      >
                        #{tag.title}
                      </Link>
                    )
                  }

                  return null
                })}
              </div>
            </div>
          )}

          <section className="mx-auto mt-10 max-w-3xl">
            <SocialShare
              className="flex items-center gap-3 text-gray-500 dark:text-gray-400"
              text={post.title || 'NABI Post'}
              url={`/posts/${decodedSlug}`}
            />
          </section>

          {post.references && post.references.length > 0 && (
            <section className="mx-auto mt-16 max-w-3xl border-t-2 border-border pt-10">
              <div className="mb-7 flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r from-primary to-accent text-sm font-semibold text-white">
                  1
                </div>
                <h2 className="text-2xl font-semibold">References</h2>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card/70 p-6 sm:p-8">
                <ol className="space-y-4">
                  {post.references.map((reference, index) => (
                    <li key={`${reference.title}-${index}`} className="group flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                      <div className="flex-1 pt-1 text-sm leading-6 text-muted-foreground">
                        <a
                          href={
                            reference.url ||
                            (reference.doi ? `https://doi.org/${reference.doi}` : '#')
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-foreground transition-colors duration-200 group-hover:underline hover:text-primary"
                        >
                          {reference.authors
                            ?.map((author) => author.name)
                            .filter(Boolean)
                            .join(', ')}
                          {reference.year ? ` (${reference.year})` : ''}. {reference.title}
                          {reference.journal ? `, ${reference.journal}` : ''}
                        </a>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          )}

          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <RelatedPosts
              className="mt-12 max-w-[52rem] lg:grid lg:grid-cols-subgrid col-start-1 col-span-3 grid-rows-[2fr]"
              docs={post.relatedPosts.filter((post) => typeof post === 'object')}
            />
          )}
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const post = await queryPostBySlug({ slug: decodedSlug })

  return generateMeta({
    doc: post,
    path: `/posts/${decodedSlug}`,
  })
}

const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const { draft, payload, user } = await getDraftAccessContext()

  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    ...(user ? { user } : {}),
    where: {
      ...(draft
        ? {
            slug: {
              equals: slug,
            },
          }
        : {
            and: [
              {
                slug: {
                  equals: slug,
                },
              },
              {
                _status: {
                  equals: 'published',
                },
              },
            ],
          }),
    },
  })

  return result.docs?.[0] || null
})
