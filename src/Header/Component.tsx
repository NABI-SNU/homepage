import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

import type { Header } from '@/payload-types'

type HeaderNavItem = NonNullable<Header['navItems']>[number]
type HeaderSubNavItems = NonNullable<HeaderNavItem['links']>

const fallbackNavItems: NonNullable<Header['navItems']> = [
  { link: { type: 'custom', label: 'About', url: '/about' } },
  { link: { type: 'custom', label: 'People', url: '/people' } },
  { link: { type: 'custom', label: 'Symposium', url: '/symposium' } },
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
    ],
  },
  { link: { type: 'custom', label: 'Contact', url: '/contact' } },
]

const articlesDropdownLinks: HeaderSubNavItems = [
  { link: { type: 'custom', label: 'All Posts', url: '/posts' } },
  { link: { type: 'custom', label: 'Monthly Meetings', url: '/category/monthly-meeting' } },
  { link: { type: 'custom', label: 'Opinions', url: '/category/opinions' } },
]

const resourcesDropdownLinks: HeaderSubNavItems = [
  { link: { type: 'custom', label: 'Research', url: '/labs' } },
  { link: { type: 'custom', label: 'News', url: '/news' } },
  { link: { type: 'custom', label: 'Bibliography', url: '/references' } },
]

const normalizeNavItems = (items: Header['navItems']): NonNullable<Header['navItems']> => {
  const source = (items || []).filter((item) => Boolean(item?.link?.label))

  if (source.length === 0) return fallbackNavItems

  const hasAnyDropdown = source.some((item) => (item.links || []).length > 0)
  if (hasAnyDropdown) return source

  const labels = new Set(source.map((item) => (item.link.label || '').toLowerCase().trim()))
  const legacyFlatNav = labels.has('posts') && labels.has('news') && labels.has('research')

  if (!legacyFlatNav) return source

  const keep = source.filter((item) => {
    const label = (item.link.label || '').toLowerCase().trim()
    return label !== 'posts' && label !== 'news' && label !== 'research'
  })

  const hasContact = keep.some((item) => (item.link.label || '').toLowerCase().trim() === 'contact')
  const withDropdowns: NonNullable<Header['navItems']> = [
    ...keep,
    { link: { type: 'custom', label: 'Articles', url: '/posts' }, links: articlesDropdownLinks },
    { link: { type: 'custom', label: 'Resources', url: '/labs' }, links: resourcesDropdownLinks },
  ]

  if (!hasContact) {
    withDropdowns.push({ link: { type: 'custom', label: 'Contact', url: '/contact' } })
  }

  return withDropdowns
}

export async function Header() {
  const headerData: Header = await getCachedGlobal('header', 1)()
  const normalizedHeaderData: Header = {
    ...headerData,
    navItems: normalizeNavItems(headerData?.navItems),
  }

  return <HeaderClient data={normalizedHeaderData} />
}
