import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

import type { Header } from '@/payload-types'

type HeaderNavItem = NonNullable<Header['navItems']>[number]
type HeaderSubNavItems = NonNullable<HeaderNavItem['links']>

const fallbackNavItems: NonNullable<Header['navItems']> = [
  { link: { type: 'custom', label: 'About', url: '/about' } },
  { link: { type: 'custom', label: 'People', url: '/people' } },
  {
    link: { type: 'custom', label: 'Activities', url: '/conferences' },
    links: [
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

const normalizedLabel = (item: HeaderNavItem) => (item.link.label || '').toLowerCase().trim()

const normalizeActivitiesNavigation = (
  navItems: NonNullable<Header['navItems']>,
): NonNullable<Header['navItems']> => {
  const hasActivities = navItems.some((item) => normalizedLabel(item) === 'activities')
  if (hasActivities) return navItems

  const symposiumIndex = navItems.findIndex((item) => normalizedLabel(item) === 'symposium')
  const conferencesIndex = navItems.findIndex((item) => normalizedLabel(item) === 'conferences')

  if (symposiumIndex < 0 && conferencesIndex < 0) return navItems

  const symposiumItem = symposiumIndex >= 0 ? navItems[symposiumIndex] : null
  const conferencesItem = conferencesIndex >= 0 ? navItems[conferencesIndex] : null

  const filtered = navItems.filter((item) => {
    const label = normalizedLabel(item)
    return label !== 'symposium' && label !== 'conferences'
  })

  const insertIndex = [symposiumIndex, conferencesIndex]
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0]

  const symposiumLink = symposiumItem?.link || { type: 'custom', label: 'Symposium', url: '/symposium' }
  const conferencesLink = conferencesItem?.link || {
    type: 'custom',
    label: 'Conferences',
    url: '/conferences',
  }
  const activitiesItem: HeaderNavItem = {
    link: { type: 'custom', label: 'Activities', url: '/conferences' },
    links: [{ link: symposiumLink }, { link: conferencesLink }],
  }

  filtered.splice(insertIndex ?? 2, 0, activitiesItem)

  return filtered
}

const normalizeNavItems = (items: Header['navItems']): NonNullable<Header['navItems']> => {
  const source = (items || []).filter((item) => Boolean(item?.link?.label))

  if (source.length === 0) return fallbackNavItems

  const withActivities = normalizeActivitiesNavigation(source)
  const hasAnyDropdown = withActivities.some((item) => (item.links || []).length > 0)
  if (hasAnyDropdown) return withActivities

  const labels = new Set(withActivities.map((item) => normalizedLabel(item)))
  const legacyFlatNav = labels.has('posts') && labels.has('news') && labels.has('research')

  if (!legacyFlatNav) return withActivities

  const keep = withActivities.filter((item) => {
    const label = normalizedLabel(item)
    return label !== 'posts' && label !== 'news' && label !== 'research'
  })

  const hasContact = keep.some((item) => normalizedLabel(item) === 'contact')
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
