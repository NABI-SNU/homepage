'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { getActivityPathFromReferenceValue } from '@/utilities/activityURL'
import { cn } from '@/utilities/ui'
import { ChevronDown } from 'lucide-react'
import { usePathname } from 'next/navigation'

type HeaderNavItem = NonNullable<NonNullable<HeaderType['navItems']>[number]>
type HeaderNavLink = HeaderNavItem['link']
type HeaderSubNavItem = NonNullable<NonNullable<HeaderNavItem['links']>[number]>

const fallbackNavItems: HeaderNavItem[] = [
  { link: { type: 'custom', label: 'About', url: '/about' } },
  { link: { type: 'custom', label: 'People', url: '/people' } },
  {
    link: { type: 'custom', label: 'Activities', url: '/conferences' },
    links: [
      { link: { type: 'custom', label: 'Announcements', url: '/announcements' } },
      { link: { type: 'custom', label: 'Symposium', url: '/symposium' } },
      { link: { type: 'custom', label: 'Conferences', url: '/conferences' } },
    ],
  },
  {
    link: { type: 'custom', label: 'Articles', url: '/posts' },
    links: [
      { link: { type: 'custom', label: 'All Posts', url: '/posts' } },
      { link: { type: 'custom', label: 'Monthly Meetings', url: '/category/monthly-meeting' } },
      { link: { type: 'custom', label: 'Opinions', url: '/category/opinions' } },
    ],
  },
  {
    link: { type: 'custom', label: 'Resources', url: '/labs' },
    links: [
      { link: { type: 'custom', label: 'Research', url: '/labs' } },
      { link: { type: 'custom', label: 'News', url: '/news' } },
      { link: { type: 'custom', label: 'Bibliography', url: '/references' } },
      { link: { type: 'custom', label: 'Wiki', url: '/wiki' } },
      {
        link: {
          type: 'custom',
          label: 'Book',
          url: 'https://book.nabilab.org',
          newTab: true,
        },
      },
    ],
  },
  { link: { type: 'custom', label: 'Contact', url: '/contact' } },
]

const hasRenderableLink = (link: HeaderNavLink | undefined | null) => {
  if (!link?.label) return false

  if (link.type === 'custom') {
    return Boolean(link.url)
  }

  if (link.type === 'reference') {
    return Boolean(typeof link.reference?.value === 'object' && link.reference?.value?.slug)
  }

  return false
}

const getNavHref = (link: HeaderNavLink | undefined) => {
  if (!link) return ''

  if (link.type === 'custom') {
    return link.url || ''
  }

  if (
    link.type === 'reference' &&
    typeof link.reference?.value === 'object' &&
    link.reference.value?.slug
  ) {
    const relationTo = link.reference.relationTo
    if (relationTo === 'research') return `/labs/${link.reference.value.slug}`
    if (relationTo === 'announcements') return `/announcements/${link.reference.value.slug}`
    if (relationTo === 'activities')
      return getActivityPathFromReferenceValue(link.reference.value) || ''

    return `/${relationTo}/${link.reference.value.slug}`
  }

  return ''
}

const getRenderableSubLinks = (item: HeaderNavItem): HeaderSubNavItem[] =>
  (item.links || []).filter((subLink) => hasRenderableLink(subLink?.link))

const isPathActive = (pathname: string | null, href: string) =>
  Boolean(href) && (pathname === href || (href !== '/' && pathname?.startsWith(`${href}/`)))

export const HeaderNav: React.FC<{
  data: HeaderType
  mobile?: boolean
  onNavigate?: () => void
}> = ({ data, mobile = false, onNavigate }) => {
  const pathname = usePathname()
  const sourceItems = (data?.navItems || []).filter((item) => hasRenderableLink(item?.link))
  const navItems = sourceItems.length > 0 ? sourceItems : fallbackNavItems

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        mobile
          ? 'flex flex-col gap-5 text-xl leading-[1.25] font-semibold'
          : 'hidden min-w-0 w-full items-center justify-center gap-2.5 lg:flex',
      )}
      onClick={mobile ? onNavigate : undefined}
    >
      {navItems.map((item, i) => {
        const { link } = item
        const href = getNavHref(link)
        const isExternal = href.startsWith('http://') || href.startsWith('https://')
        const isActive = !isExternal && isPathActive(pathname, href)
        const subLinks = getRenderableSubLinks(item)
        const hasDropdown = !mobile && subLinks.length > 0
        const hasActiveChild = subLinks.some((subLink) => {
          const childHref = getNavHref(subLink.link)
          const childExternal = childHref.startsWith('http://') || childHref.startsWith('https://')
          return !childExternal && isPathActive(pathname, childHref)
        })

        if (hasDropdown) {
          return (
            <div className="group relative" key={i}>
              <button
                className={cn(
                  'flex items-center whitespace-nowrap px-3 py-3 text-[1.125rem] tracking-[0.01rem] transition-colors duration-200',
                  isActive || hasActiveChild
                    ? 'text-primary'
                    : 'text-foreground hover:text-primary',
                )}
                type="button"
              >
                {link.label}
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <ul className="invisible absolute left-0 top-full z-50 min-w-[180px] rounded-lg border border-border/80 bg-background/95 py-3.5 opacity-0 shadow-xl backdrop-blur-md transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                {subLinks.map((subLink, subIndex) => (
                  <li key={`${subLink.link.label}-${subIndex}`}>
                    <CMSLink
                      {...subLink.link}
                      appearance="inline"
                      className={cn(
                        'block whitespace-nowrap px-5 py-2.5 text-base leading-tight transition-colors duration-200',
                        isPathActive(pathname, getNavHref(subLink.link))
                          ? 'text-primary'
                          : 'text-foreground hover:text-primary',
                      )}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )
        }

        return (
          <div className={cn(mobile && subLinks.length > 0 ? 'mb-4' : '')} key={i}>
            <CMSLink
              {...link}
              appearance="inline"
              className={cn(
                mobile
                  ? 'px-4 py-5 text-foreground transition-colors hover:text-primary'
                  : 'flex items-center whitespace-nowrap px-3 py-4 text-[1.125rem] tracking-[0.01rem] transition-colors duration-200',
                isActive ? 'text-primary' : 'text-foreground hover:text-primary',
              )}
            />
            {mobile && subLinks.length > 0 && (
              <div className="ml-5 border-l border-border/60 py-2.5 pl-4">
                {subLinks.map((subLink, subIndex) => (
                  <CMSLink
                    key={`${subLink.link.label}-${subIndex}`}
                    {...subLink.link}
                    appearance="inline"
                    className={cn(
                      'block py-2.5 text-lg leading-[1.3] text-muted-foreground transition-colors hover:text-primary',
                      isPathActive(pathname, getNavHref(subLink.link)) ? 'text-primary' : '',
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
