import { cn } from '@/utilities/ui'
import React from 'react'

import { Card, CardDocData } from '@/components/Card'

export type Props = {
  cardImageAspect?: 'landscape' | 'portrait'
  compact?: boolean
  posts: CardDocData[]
  relationTo?: 'posts' | 'news' | 'wiki' | 'conferences' | 'symposium' | 'labs'
  showCategories?: boolean
  showDate?: boolean
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const {
    cardImageAspect = 'landscape',
    compact = false,
    posts,
    relationTo,
    showCategories = true,
    showDate = false,
  } = props

  return (
    <div className={cn('container')}>
      <div>
        <div className="grid grid-cols-4 gap-5 sm:grid-cols-8 lg:grid-cols-12 lg:gap-7">
          {posts?.map((result, index) => {
            if (typeof result === 'object' && result !== null) {
              const fallbackRelation = relationTo || result.relationTo || 'posts'
              const cardKey = result.slug
                ? `${fallbackRelation}-${result.slug}`
                : `${fallbackRelation}-${index}`

              return (
                <div
                  className={cn(compact ? 'col-span-4 sm:col-span-8 lg:col-span-12' : 'col-span-4')}
                  key={cardKey}
                >
                  <Card
                    className="h-full"
                    doc={result}
                    imageAspect={cardImageAspect}
                    relationTo={relationTo}
                    showCategories={showCategories}
                    showDate={showDate}
                  />
                </div>
              )
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}
