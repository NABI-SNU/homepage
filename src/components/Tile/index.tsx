import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/ui'

/**
 * Shared look of the site's clickable tiles (post cards, people cards, seminar and book links):
 * a soft card that lifts on hover, with a faint primary-to-accent wash and two accent dots.
 * Put `TileDecorations` first inside an element that has `tileClassName`.
 */
export const tileClassName =
  'group relative overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-primary/30 hover:shadow-xl focus-within:border-primary/40'

/** Pill used for small labels on tiles, matching the people directory's role and interest pills. */
export const tilePillClassName =
  'rounded-full border border-border/70 bg-card/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors duration-300 group-hover:text-foreground'

/** Title text inside a tile; turns primary on hover like the people cards. */
export const tileTitleClassName = 'transition-colors duration-300 group-hover:text-primary'

export const TileDecorations: React.FC = () => (
  <>
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary/5 to-accent/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
    />
    <div
      aria-hidden
      className="pointer-events-none absolute -left-1 -top-1 h-8 w-8 rounded-full bg-linear-to-br from-primary/20 to-accent/20 opacity-0 blur-sm transition-all duration-500 ease-out group-hover:scale-150 group-hover:opacity-100"
    />
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-4 right-4 h-2 w-2 rounded-full bg-linear-to-r from-green-400 to-primary opacity-0 transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-100 group-hover:shadow-lg group-hover:shadow-primary/40"
    />
  </>
)

/** Full-tile link overlay, as on post cards: the whole tile is clickable. */
export const TileLinkOverlay: React.FC<{
  external?: boolean
  href: string
  label: string
}> = ({ external, href, label }) => {
  const className =
    'absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70'

  if (external) {
    return (
      <a aria-label={label} className={className} href={href} rel="noreferrer" target="_blank" />
    )
  }

  return <Link aria-label={label} className={className} href={href} />
}

export const Tile: React.FC<
  React.HTMLAttributes<HTMLElement> & { as?: 'article' | 'div' | 'li' }
> = ({ as: Component = 'div', children, className, ...rest }) => (
  <Component className={cn(tileClassName, className)} {...rest}>
    <TileDecorations />
    {children}
  </Component>
)
