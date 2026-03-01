import { cn } from '@/utilities/ui'
import React from 'react'

import { Card, CardDocData } from '@/components/Card'

export type Props = {
  posts: CardDocData[]
  relationTo?: 'posts' | 'news'
  showCategories?: boolean
  showDate?: boolean
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { posts, relationTo = 'posts', showCategories = true, showDate = false } = props

  return (
    <div className={cn('container')}>
      <div>
        <div className="grid grid-cols-4 gap-5 sm:grid-cols-8 lg:grid-cols-12 lg:gap-7">
          {posts?.map((result, index) => {
            if (typeof result === 'object' && result !== null) {
              return (
                <div className="col-span-4" key={index}>
                  <Card className="h-full" doc={result} relationTo={relationTo} showCategories={showCategories} showDate={showDate} />
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
