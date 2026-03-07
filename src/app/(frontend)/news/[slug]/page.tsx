import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React, { cache } from 'react'
import Image from 'next/image'

import RichText from '@/components/RichText'
import { TableOfContents } from '@/components/TableOfContents'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Media } from '@/components/Media'
import { formatDateTime } from '@/utilities/formatDateTime'
import { getDraftAccessContext } from '@/utilities/getDraftAccessContext'
import { extractLegacyImageFromLexical } from '@/utilities/legacyImage'
import { generateMeta } from '@/utilities/generateMeta'
import { SocialShare } from '@/components/SocialShare'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const news = await payload.find({
    collection: 'news',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  return news.docs.map(({ slug }) => ({ slug }))
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function NewsDetailPage({ params: paramsPromise }: Args) {
  const { draft } = await getDraftAccessContext()
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const url = '/news/' + decodedSlug
  const entry = await queryNewsBySlug({ slug: decodedSlug })

  if (!entry) {
    return <PayloadRedirects url={url} />
  }

  const fallbackPreviewImage = extractLegacyImageFromLexical(entry.content)

  return (
    <article className="pb-20 pt-6 md:pt-10">
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <section className="relative pt-8 md:pt-12">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Published</span>
                {entry.date ? (
                  <time dateTime={entry.date}>{formatDateTime(entry.date)}</time>
                ) : (
                  <span>Undated</span>
                )}
              </div>
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              {entry.title}
            </h1>
            <div className="mt-6 h-1 w-28 rounded-full bg-linear-to-r from-primary to-accent" />

            {entry.description && (
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
                {entry.description}
              </p>
            )}
          </div>

          {entry.image && typeof entry.image === 'object' && (
            <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-border shadow-xl shadow-black/10">
              <Media
                resource={entry.image}
                pictureClassName="block w-full"
                imgClassName="h-auto w-full bg-muted object-cover"
                priority
              />
            </div>
          )}
          {(!entry.image || typeof entry.image !== 'object') && fallbackPreviewImage?.src && (
            <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-border shadow-xl shadow-black/10">
              <Image
                alt={fallbackPreviewImage.alt}
                className="h-auto w-full bg-muted object-cover"
                height={fallbackPreviewImage.height ?? 900}
                loading="lazy"
                sizes="100vw"
                src={fallbackPreviewImage.src}
                unoptimized
                width={fallbackPreviewImage.width ?? 1600}
              />
            </div>
          )}
        </div>
      </section>

      <TableOfContents />

      <div className="flex flex-col items-center gap-4 pt-10">
        <div className="container">
          <div data-post-content>
            <RichText
              className="mx-auto max-w-3xl md:prose-lg prose-headings:scroll-mt-28"
              data={entry.content}
              enableGutter={false}
              enableMathJax
            />
          </div>

          <section className="mx-auto mt-10 max-w-3xl">
            <SocialShare
              className="flex items-center gap-3 text-gray-500 dark:text-gray-400"
              text={entry.title || 'NABI News'}
              url={`/news/${decodedSlug}`}
            />
          </section>

          {entry.references && entry.references.length > 0 && (
            <section className="mx-auto mt-16 max-w-3xl border-t-2 border-border pt-10">
              <div className="mb-7 flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r from-primary to-accent text-sm font-semibold text-white">
                  1
                </div>
                <h2 className="text-2xl font-semibold">References</h2>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card/70 p-6 sm:p-8">
                <ol className="space-y-4">
                  {entry.references.map((reference, index) => (
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
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const entry = await queryNewsBySlug({ slug: decodedSlug })

  return generateMeta({
    description: entry?.description || 'Monthly highlights',
    doc: entry
      ? {
          meta: {
            description: entry.description,
            image: entry.image,
            title: entry.title,
          },
          slug: ['news', decodedSlug],
        }
      : null,
    path: `/news/${decodedSlug}`,
    title: entry?.title || 'News',
  })
}

const queryNewsBySlug = cache(async ({ slug }: { slug: string }) => {
  const { draft, payload, user } = await getDraftAccessContext()

  const news = await payload.find({
    collection: 'news',
    depth: 2,
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

  return news.docs[0] || null
})
