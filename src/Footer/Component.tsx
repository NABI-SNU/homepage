import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '@/payload-types'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()
  const wikiLinkItem: { link: { label: string; type: 'custom'; url: string } } = {
    link: { label: 'Wiki', type: 'custom', url: '/wiki' },
  }

  const navItems = footerData?.navItems || []
  const secondaryLinks =
    footerData?.secondaryLinks && footerData.secondaryLinks.length > 0
      ? footerData.secondaryLinks
      : navItems.slice(0, 2)
  const footerColumns =
    footerData?.columns && footerData.columns.length > 0
      ? footerData.columns
      : [
          {
            title: 'Explore',
            links: navItems.slice(2, 5),
          },
          {
            title: 'Resources',
            links: navItems.slice(5),
          },
        ]
  const linkColumns = footerColumns.filter((column) => (column?.links || []).length > 0)
  const socialLinks = footerData?.socialLinks || []
  const footNote = footerData?.footNote || 'NABI Labs'
  const brandName = footerData?.brandName || 'NABI Labs'
  const legacyColumns = [navItems.slice(2, 5), navItems.slice(5)].filter(
    (column) => column.length > 0,
  )
  const hasWikiInColumn = (column: any) =>
    Boolean((column?.links || []).some((item: any) => item?.link?.url === '/wiki'))
  const hasWikiInLegacyColumns = legacyColumns.some((column) =>
    column.some((item) => item?.link?.url === '/wiki'),
  )
  const normalizedLinkColumns =
    linkColumns.length > 0
      ? linkColumns.map((column, index) => {
          const isResourcesColumn =
            (column.title || '').toLowerCase().includes('resource') ||
            index === linkColumns.length - 1
          if (!isResourcesColumn || hasWikiInColumn(column)) return column

          return {
            ...column,
            links: [...(column.links || []), wikiLinkItem],
          }
        })
      : legacyColumns.map((links, index) => {
          const title = index === 0 ? 'Explore' : 'Resources'
          if (title !== 'Resources' || hasWikiInLegacyColumns) {
            return { title, links }
          }

          return {
            title,
            links: [...links, wikiLinkItem],
          }
        })
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-auto border-t border-border not-prose">
      <div className="pointer-events-none absolute inset-0 bg-background" aria-hidden="true" />
      <div className="container relative py-8 md:py-12">
        <div className="grid grid-cols-12 gap-4 gap-y-8 sm:gap-8">
          <div className="col-span-12 lg:col-span-4">
            <div className="mb-2">
              <Link className="inline-flex items-center" href="/">
                <Logo />
              </Link>
            </div>
            <div className="mb-3 text-sm font-medium text-foreground">{brandName}</div>
            <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              {secondaryLinks.map(({ link }, index) => (
                <React.Fragment key={`${link?.label || 'secondary'}-${index}`}>
                  {index !== 0 && <span aria-hidden="true">·</span>}
                  <CMSLink
                    className="text-muted-foreground transition-colors duration-150 ease-in-out hover:text-foreground hover:underline"
                    {...(link as any)}
                  />
                </React.Fragment>
              ))}
            </div>
          </div>

          {normalizedLinkColumns.map((column, columnIndex) => (
            <div className="col-span-6 md:col-span-3 lg:col-span-2" key={`column-${columnIndex}`}>
              <div className="mb-2 font-medium text-foreground">
                {column.title || (columnIndex === 0 ? 'Explore' : 'Resources')}
              </div>
              <ul className="text-sm">
                {(column.links || []).map(({ link }, linkIndex) => (
                  <li className="mb-2" key={`${link?.label || 'link'}-${linkIndex}`}>
                    <CMSLink
                      className="text-muted-foreground transition-colors duration-150 ease-in-out hover:text-foreground hover:underline"
                      {...(link as any)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="py-6 md:flex md:items-center md:justify-between md:py-8">
          <div className="flex flex-wrap items-center gap-2">
            {socialLinks.map((social, index) => (
              <a
                key={`${social.url}-${index}`}
                href={social.url}
                aria-label={social.ariaLabel || social.label}
                className="inline-flex items-center rounded-lg p-2 text-sm text-muted-foreground transition-colors duration-150 ease-in-out hover:bg-muted hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                {social.label}
              </a>
            ))}
          </div>
          <div className="mr-4 mt-4 text-sm text-muted-foreground md:mt-0">
            © {year} {footNote}
          </div>
          <div className="mt-4 md:mt-0 md:ml-4">
            <ThemeSelector />
          </div>
        </div>
      </div>
    </footer>
  )
}
