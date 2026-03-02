import { formatDateTime } from 'src/utilities/formatDateTime'
import Link from 'next/link'
import React from 'react'

import { Media } from '@/components/Media'
import { PersonAvatar } from '@/components/people/PersonAvatar'
import type { Person, Post } from '@/payload-types'

type AuthorEntry = {
  avatar?: Person['avatar']
  email?: string | null
  name: string
  slug: string
}

export const PostHero: React.FC<{
  post: Post
  metaAction?: React.ReactNode
}> = ({ metaAction, post }) => {
  const { authors, categories, excerpt, heroImage, publishedAt, title } = post

  const authorEntries = (authors || [])
    .map((author): AuthorEntry | null => {
      if (typeof author !== 'object' || !author) return null

      return {
        avatar: author.avatar,
        email: author.email,
        name: author.name || author.slug || 'Unknown author',
        slug: author.slug || '',
      }
    })
    .filter((author): author is AuthorEntry => Boolean(author))

  return (
    <section className="relative pt-8 md:pt-12">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Published</span>
                {publishedAt ? <time dateTime={publishedAt}>{formatDateTime(publishedAt)}</time> : <span>Undated</span>}
              </div>

              {authorEntries.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">Author</span>
                  {authorEntries.map((author, index) => (
                    <React.Fragment key={`${author.slug || author.name}-${index}`}>
                      {author.slug ? (
                        <Link
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2 py-1 text-foreground transition hover:border-primary/40 hover:bg-muted"
                          href={`/people/${author.slug}`}
                        >
                          <PersonAvatar
                            avatar={author.avatar}
                            email={author.email}
                            name={author.name}
                            size={20}
                          />
                          <span className="text-xs">{author.name}</span>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2 py-1 text-foreground">
                          <PersonAvatar
                            avatar={author.avatar}
                            email={author.email}
                            name={author.name}
                            size={20}
                          />
                          <span className="text-xs">{author.name}</span>
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {categories && categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {categories.map((category, index) => {
                    if (typeof category === 'object' && category !== null) {
                      const titleToUse = category.title || 'Untitled category'
                      const categorySlug = category.slug
                      const isLast = index === categories.length - 1

                      return (
                        <React.Fragment key={index}>
                          {categorySlug ? (
                            <Link className="text-foreground hover:text-primary hover:underline" href={`/category/${categorySlug}`}>
                              {titleToUse}
                            </Link>
                          ) : (
                            <span className="text-foreground">{titleToUse}</span>
                          )}
                          {!isLast && <React.Fragment>,</React.Fragment>}
                        </React.Fragment>
                      )
                    }

                    return null
                  })}
                </div>
              )}
            </div>

            {metaAction ? <div className="ml-auto shrink-0 self-end">{metaAction}</div> : null}
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">{title}</h1>
          <div className="mt-6 h-1 w-28 rounded-full bg-linear-to-r from-primary to-accent" />

          {excerpt && <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">{excerpt}</p>}
        </div>

        {heroImage && typeof heroImage !== 'string' && (
          <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-border shadow-xl shadow-black/10">
            <Media
              resource={heroImage}
              pictureClassName="block w-full"
              imgClassName="h-auto w-full bg-muted object-cover"
              priority
            />
          </div>
        )}
      </div>
    </section>
  )
}
