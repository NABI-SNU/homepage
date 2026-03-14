import type { Metadata } from 'next'
import {
  BookOpen,
  Calendar,
  CalendarDays,
  FlaskConical,
  Laptop,
  MapPin,
  Users,
  Wifi,
} from 'lucide-react'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { CollectionArchive } from '@/components/CollectionArchive'
import type { CardDocData } from '@/components/Card'
import { MathJaxTypeset } from '@/components/MathJax/Typeset'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { SocialShare } from '@/components/SocialShare'
import type { Media as MediaDoc, Post, Research } from '@/payload-types'
import {
  getCachedActivityBySlugAndType,
  getCachedActivitySlugsByType,
} from '@/utilities/activityCache'
import { formatDateTime } from '@/utilities/formatDateTime'
import { generateMeta } from '@/utilities/generateMeta'

export const revalidate = 3600

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const getNumericRelationIDs = (
  values: (number | null | Post | Research)[] | null | undefined,
): number[] =>
  Array.from(new Set(values?.filter((value): value is number => typeof value === 'number') || []))

const getResolvedMedia = (
  value: MediaDoc | number | null | undefined,
  mediaByID: Map<number, MediaDoc>,
): MediaDoc | null => {
  if (value && typeof value === 'object') return value
  if (typeof value === 'number') return mediaByID.get(value) || null
  return null
}

export async function generateStaticParams() {
  const slugs = await getCachedActivitySlugsByType('symposium')()
  return slugs.map((slug) => ({ slug }))
}

export default async function SymposiumDetailPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const url = '/symposium/' + decodedSlug
  const entry = await getCachedActivityBySlugAndType({
    activityType: 'symposium',
    depth: 0,
    slug: decodedSlug,
  })()

  if (!entry) {
    return <PayloadRedirects url={url} />
  }

  const payload = await getPayload({ config: configPromise })
  const relatedPostIDs = getNumericRelationIDs(entry.relatedPosts)
  const relatedResearchIDs = getNumericRelationIDs(entry.relatedResearch)
  const mediaIDs = getNumericRelationIDs([entry.heroImage, entry.meta?.image || null] as (
    | number
    | null
    | Post
    | Research
  )[])
  const [relatedPostsResponse, relatedResearchResponse, mediaResponse] = await Promise.all([
    relatedPostIDs.length > 0
      ? payload.find({
          collection: 'posts',
          depth: 1,
          limit: relatedPostIDs.length,
          overrideAccess: false,
          pagination: false,
          where: {
            and: [
              {
                _status: {
                  equals: 'published',
                },
              },
              {
                id: {
                  in: relatedPostIDs,
                },
              },
            ],
          },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            heroImage: true,
            meta: true,
          },
        })
      : Promise.resolve({ docs: [] as Post[] }),
    relatedResearchIDs.length > 0
      ? payload.find({
          collection: 'research',
          depth: 1,
          limit: relatedResearchIDs.length,
          overrideAccess: false,
          pagination: false,
          where: {
            and: [
              {
                _status: {
                  equals: 'published',
                },
              },
              {
                id: {
                  in: relatedResearchIDs,
                },
              },
            ],
          },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            date: true,
            image: true,
          },
        })
      : Promise.resolve({ docs: [] as Research[] }),
    mediaIDs.length > 0
      ? payload.find({
          collection: 'media',
          depth: 0,
          limit: mediaIDs.length,
          overrideAccess: false,
          pagination: false,
          where: {
            id: {
              in: mediaIDs,
            },
          },
          select: {
            alt: true,
            createdAt: true,
            filename: true,
            filesize: true,
            height: true,
            mimeType: true,
            sizes: true,
            updatedAt: true,
            url: true,
            width: true,
          },
        })
      : Promise.resolve({ docs: [] as MediaDoc[] }),
  ])

  const mediaByID = new Map(
    mediaResponse.docs
      .filter((media): media is MediaDoc & { id: number } => typeof media.id === 'number')
      .map((media) => [media.id, media]),
  )
  const heroImage =
    getResolvedMedia(entry.heroImage, mediaByID) || getResolvedMedia(entry.meta?.image, mediaByID)
  const symposiumYear = entry.date
    ? new Date(entry.date).getUTCFullYear() - 1
    : new Date().getUTCFullYear() - 1

  const relatedPostsBySlug = new Map<string, CardDocData>()
  const relatedResearchBySlug = new Map<string, CardDocData>()

  const relatedPostsByID = new Map(
    relatedPostsResponse.docs
      .filter((doc): doc is Post & { id: number } => typeof doc.id === 'number')
      .map((doc) => [doc.id, doc]),
  )
  relatedPostIDs.forEach((relatedPostID) => {
    const post = relatedPostsByID.get(relatedPostID)
    if (!post) return
    if (!post.slug || relatedPostsBySlug.has(post.slug)) return

    const postHeroImage =
      post.heroImage && typeof post.heroImage === 'object' ? post.heroImage : null
    const postMetaImage =
      post.meta?.image && typeof post.meta.image === 'object' ? post.meta.image : null

    relatedPostsBySlug.set(post.slug, {
      title: post.title,
      slug: post.slug,
      relationTo: 'posts',
      meta: {
        ...(post.meta || {}),
        description: post.meta?.description || post.excerpt || undefined,
        image: postMetaImage || postHeroImage,
      },
    })
  })

  const relatedResearchByID = new Map(
    relatedResearchResponse.docs
      .filter((doc): doc is Research & { id: number } => typeof doc.id === 'number')
      .map((doc) => [doc.id, doc]),
  )
  relatedResearchIDs.forEach((relatedResearchID) => {
    const research = relatedResearchByID.get(relatedResearchID)
    if (!research) return
    if (!research.slug || relatedResearchBySlug.has(research.slug)) return

    const researchImage =
      research.image && typeof research.image === 'object' ? research.image : null

    relatedResearchBySlug.set(research.slug, {
      title: research.title,
      slug: research.slug,
      relationTo: 'labs',
      date: research.date || undefined,
      meta: {
        description: research.description || undefined,
        image: researchImage,
      },
    })
  })

  const relatedPosts = Array.from(relatedPostsBySlug.values())
  const relatedResearch = Array.from(relatedResearchBySlug.values())

  return (
    <main className="page-shell pb-12 md:pb-16">
      <MathJaxTypeset />

      <PayloadRedirects disableNotFound url={url} />

      <section className="relative not-prose md:-mt-[76px]">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="pointer-events-none pt-0 md:pt-[76px]" />
          <div className="py-12 pb-4 md:py-20 md:pb-4">
            <div className="mx-auto max-w-5xl text-center">
              <p className="mx-auto inline-flex rounded-full border border-blue-400/40 bg-blue-500/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300 dark:border-blue-400/60 dark:bg-blue-500/20 dark:text-blue-200">
                {symposiumYear ? `Symposium ${symposiumYear}` : 'Symposium'}
              </p>
              <h1 className="mb-4 mt-4 text-5xl font-semibold leading-tight tracking-tight text-black drop-shadow-[0_4px_24px_rgba(59,130,246,0.25)] dark:text-gray-100 dark:drop-shadow-[0_4px_24px_rgba(59,130,246,0.35)] md:text-6xl">
                {entry.title}
              </h1>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl pb-8 pt-0 sm:pb-16 sm:pt-2 lg:pb-20 lg:pt-4">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-blue-400/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-purple-400/5 blur-3xl" />
        </div>

        <article className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <header className="mb-12">
            <div className="space-y-6 text-center lg:text-left">
              {entry.description && (
                <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-600 dark:text-gray-300 sm:text-2xl lg:mx-0">
                  {entry.description}
                </p>
              )}
              <div className="mx-auto h-1 w-24 rounded-full bg-linear-to-r from-blue-500 to-purple-600 lg:mx-0" />
            </div>
          </header>

          <div className="relative">
            <div className="mb-12 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50 sm:p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-purple-600">
                  <CalendarDays className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                  Event Details
                </h2>
              </div>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>
                    <strong>Date:</strong>{' '}
                    {entry.date ? (
                      <time dateTime={entry.date}>{formatDateTime(entry.date)}</time>
                    ) : (
                      'TBD'
                    )}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>
                    <strong>Location:</strong> {entry.location || 'To be announced'}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>
                    <strong>Audience:</strong> NABI members and the SNU community
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Laptop className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>
                    <strong>Bring:</strong> Personal laptop recommended for interactive methods
                    sessions.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Wifi className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>
                    <strong>Note:</strong> Ensure Wi-Fi or internet access is available in advance.
                  </span>
                </li>
              </ul>
            </div>

            {heroImage && (
              <div className="mb-12 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-xl dark:border-gray-700 dark:bg-gray-800/50">
                <Media
                  resource={heroImage}
                  pictureClassName="block w-full"
                  imgClassName="h-auto w-full bg-muted object-cover"
                  priority
                />
              </div>
            )}

            <div data-post-content>
              <RichText
                className="prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:leading-tight prose-headings:text-gray-900 prose-headings:tracking-tight prose-p:mb-6 prose-p:leading-relaxed prose-p:text-gray-700 prose-a:font-medium prose-a:text-primary prose-a:no-underline prose-a:transition-colors prose-a:duration-200 hover:prose-a:underline prose-strong:font-semibold prose-strong:text-gray-900 prose-code:rounded-sm prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:text-sm prose-code:text-pink-600 prose-pre:rounded-xl prose-pre:border prose-pre:border-gray-200 prose-pre:bg-gray-900 prose-pre:shadow-lg prose-blockquote:my-6 prose-blockquote:rounded-r-lg prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-blue-50 prose-blockquote:px-6 prose-blockquote:py-4 prose-li:text-gray-700 prose-img:mx-auto prose-img:rounded-xl prose-img:border prose-img:border-gray-200 prose-img:shadow-lg prose-hr:my-12 prose-hr:border-gray-300 prose-table:overflow-hidden prose-table:rounded-lg prose-table:border prose-table:border-gray-300 prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-4 prose-th:py-3 prose-th:font-semibold prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-3 dark:prose-invert dark:prose-headings:text-gray-100 dark:prose-p:text-gray-300 dark:prose-a:text-blue-400 dark:prose-strong:text-gray-100 dark:prose-code:bg-gray-800 dark:prose-code:text-pink-400 dark:prose-pre:border-gray-700 dark:prose-pre:bg-gray-950 dark:prose-blockquote:bg-blue-900/20 dark:prose-li:text-gray-300 dark:prose-img:border-gray-700 dark:prose-hr:border-gray-600 dark:prose-table:border-gray-600 dark:prose-th:border-gray-600 dark:prose-th:bg-gray-800 dark:prose-td:border-gray-600 sm:prose-xl"
                data={entry.content}
                enableGutter={false}
              />
            </div>

            {entry.references && entry.references.length > 0 && (
              <section className="mt-16 border-t-2 border-border pt-10">
                <div className="mb-7 flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r from-primary to-accent text-sm font-semibold text-white">
                    1
                  </div>
                  <h2 className="text-2xl font-semibold">References</h2>
                </div>

                <div className="mx-auto max-w-xl rounded-2xl border border-border/80 bg-card/70 p-6 sm:p-8">
                  <ol className="space-y-4">
                    {entry.references.slice(0, 2).map((reference, index) => (
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
          </div>
        </article>
      </section>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <section id="symposium-footer" className="mb-16">
          <SocialShare
            className="flex items-center gap-3 text-gray-500 dark:text-gray-400"
            text={entry.title || 'NABI Symposium'}
            url={`/symposium/${decodedSlug}`}
          />
        </section>
      </div>

      <section className="relative mx-auto max-w-240 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/3 top-0 h-48 w-48 rounded-full bg-blue-400/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-purple-400/5 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-10 lg:flex-row lg:gap-12">
          <div className="min-w-0 flex-1">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-purple-600">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                  Further Reading
                </p>
                <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                  Related Posts
                </h2>
              </div>
            </div>
            <div className="w-full">
              {relatedPosts.length > 0 ? (
                <CollectionArchive
                  compact
                  posts={relatedPosts.slice(0, 1)}
                  relationTo="posts"
                  showCategories={false}
                />
              ) : (
                <p className="text-sm text-muted-foreground">No related posts.</p>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-purple-600">
                <FlaskConical className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                  Labs
                </p>
                <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                  Related Research
                </h2>
              </div>
            </div>
            <div className="w-full">
              {relatedResearch.length > 0 ? (
                <CollectionArchive
                  compact
                  posts={relatedResearch.slice(0, 1)}
                  relationTo="labs"
                  showCategories={false}
                  showDate
                />
              ) : (
                <p className="text-sm text-muted-foreground">No related research.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const entry = await getCachedActivityBySlugAndType({
    activityType: 'symposium',
    depth: 1,
    slug: decodedSlug,
  })()

  const previewImage =
    (entry?.heroImage && typeof entry.heroImage === 'object' ? entry.heroImage : null) ||
    (entry?.meta?.image && typeof entry.meta.image === 'object' ? entry.meta.image : null)

  return generateMeta({
    description: entry?.description || 'Symposium updates from NABI',
    doc: entry
      ? {
          meta: {
            description: entry.meta?.description || entry.description,
            image: previewImage,
            title: entry.meta?.title || entry.title,
          },
          slug: ['symposium', decodedSlug],
          title: entry.title,
        }
      : null,
    path: `/symposium/${decodedSlug}`,
    title: entry?.title || 'Symposium',
  })
}
