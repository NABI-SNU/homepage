import React from 'react'

// Mirrors the CollectionArchive grid so navigating to a dynamic listing does not jump.
export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div aria-busy="true" aria-label="Loading" className="container" role="status">
    <div className="grid grid-cols-4 gap-5 sm:grid-cols-8 lg:grid-cols-12 lg:gap-7">
      {Array.from({ length: count }, (_, index) => (
        <div
          className="col-span-4 animate-pulse overflow-hidden rounded-2xl border border-border/80 bg-card/70"
          key={index}
        >
          <div className="aspect-[3/2] bg-muted/40" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-3/4 rounded bg-muted/60" />
            <div className="h-4 w-full rounded bg-muted/40" />
            <div className="h-4 w-2/3 rounded bg-muted/40" />
          </div>
        </div>
      ))}
    </div>
  </div>
)
