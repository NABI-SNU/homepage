import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React, { Fragment } from 'react'

import type { News, Post } from '@/payload-types'

import { Media } from '@/components/Media'
import type { LegacyInlineImage } from '@/utilities/legacyImage'

export type CardPostData = Pick<Post, 'slug' | 'categories' | 'meta' | 'title'>
export type CardDocData = CardPostData & {
  date?: News['date']
  previewImage?: LegacyInlineImage | null
}

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: CardDocData
  relationTo?: 'posts' | 'news'
  showCategories?: boolean
  showDate?: boolean
  title?: string
}> = (props) => {
  const { className, doc, relationTo, showCategories, showDate, title: titleFromProps } = props

  const { slug, categories, date, meta, previewImage, title } = doc || {}
  const { description, image: metaImage } = meta || {}
  const hasRenderableImage = Boolean(metaImage && typeof metaImage === 'object')
  const hasPreviewImage = Boolean(previewImage?.src)

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ') // replace non-breaking space with white space
  const href = slug ? `/${relationTo || 'posts'}/${slug}` : ''

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-primary/30 hover:shadow-xl',
        className,
      )}
    >
      {href && (
        <Link
          aria-label={titleToUse ? `Read ${titleToUse}` : 'Open article'}
          className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          href={href}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary/5 to-accent/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute -left-1 -top-1 h-8 w-8 rounded-full bg-linear-to-br from-primary/20 to-accent/20 opacity-0 blur-sm transition-all duration-500 ease-out group-hover:scale-150 group-hover:opacity-100" />
      <div className="absolute bottom-4 right-4 h-2 w-2 rounded-full bg-linear-to-r from-green-400 to-primary opacity-0 transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-100 group-hover:shadow-lg group-hover:shadow-primary/40" />

      <div className="relative w-full overflow-hidden bg-muted/40 aspect-[16/10]">
        {!hasRenderableImage && !hasPreviewImage && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
        )}
        {hasRenderableImage && (
          <Media
            resource={metaImage}
            size="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            pictureClassName="absolute inset-0 h-full w-full"
            imgClassName="h-full w-full rounded-sm object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        )}
        {!hasRenderableImage && hasPreviewImage && (
          <img
            alt={previewImage?.alt || ''}
            className="h-full w-full rounded-sm object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            height={previewImage?.height ?? 900}
            loading="lazy"
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            src={previewImage?.src ?? ''}
            width={previewImage?.width ?? 1600}
          />
        )}
      </div>
      <div className="relative z-20 p-5">
        {showDate && date && <p className="mb-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">{new Date(date).toDateString()}</p>}
        {showCategories && hasCategories && (
          <div className="mb-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {showCategories && hasCategories && (
              <div>
                {categories?.map((category, index) => {
                  if (typeof category === 'object') {
                    const { title: titleFromCategory } = category

                    const categoryTitle = titleFromCategory || 'Untitled category'

                    const isLast = index === categories.length - 1

                    return (
                      <Fragment key={index}>
                        {categoryTitle}
                        {!isLast && <Fragment>, &nbsp;</Fragment>}
                      </Fragment>
                    )
                  }

                  return null
                })}
              </div>
            )}
          </div>
        )}
        {titleToUse && (
          <div className="prose prose-h3:my-0 prose-h3:text-xl prose-h3:font-semibold">
            <h3 className="leading-tight">{titleToUse}</h3>
          </div>
        )}
        {description && <div className="mt-3 text-sm text-muted-foreground">{description && <p>{sanitizedDescription}</p>}</div>}
      </div>
    </article>
  )
}
