'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useTheme } from '@/providers/Theme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Menu, SearchIcon, X } from 'lucide-react'

import type { Header } from '@/payload-types'

import { LoginToggle } from './LoginToggle'
import { ThemeToggle } from './ThemeToggle'
import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
}

const shouldForceLightHeader = (pathname: string | null) => {
  if (!pathname) return false
  if (pathname === '/posts' || pathname === '/news' || pathname === '/search') return true
  if (pathname.startsWith('/posts/page/')) return true
  return false
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const [isHydrated, setIsHydrated] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const { theme: globalTheme } = useTheme()
  const pathname = usePathname()
  const resolvedTheme = headerTheme ?? globalTheme ?? null
  const headerThemeAttr = isHydrated ? (resolvedTheme ?? undefined) : undefined

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    setHeaderTheme(shouldForceLightHeader(pathname) ? 'light' : null)
    setMobileMenuOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', mobileMenuOpen)

    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', onResize)

    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <header
      id="header"
      className={[
        'sticky top-0 z-40 mx-auto w-full border-b border-transparent transition-all duration-300 ease-in-out',
        mobileMenuOpen ? 'h-screen' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...(headerThemeAttr ? { 'data-theme': headerThemeAttr } : {})}
    >
      <div
        className={[
          'bg-background/90 backdrop-blur-sm transition-all duration-300 ease-in-out',
          scrolled ? 'shadow-[0_0.375rem_1.5rem_0_rgb(140_152_164_/_13%)]' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="container relative z-40 py-4 lg:py-3">
          <div className="flex items-center justify-between lg:hidden">
            <Link className="flex items-center" href="/">
              <Logo loading="eager" priority="high" />
            </Link>
            <div className="flex items-center">
              <Link
                aria-label="Search"
                className="inline-flex items-center rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                href="/search"
              >
                <span className="sr-only">Search</span>
                <SearchIcon className="h-5 w-5" />
              </Link>
              <LoginToggle />
              <ThemeToggle />
              <button
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                className="inline-flex items-center rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                onClick={() => setMobileMenuOpen((open) => !open)}
                type="button"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="hidden lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-4">
            <div className="flex justify-start">
              <Link className="flex items-center" href="/">
                <Logo loading="eager" priority="high" />
              </Link>
            </div>

            <HeaderNav data={data} />

            <div className="flex items-center justify-end">
              <Link
                aria-label="Search"
                className="inline-flex items-center rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                href="/search"
              >
                <span className="sr-only">Search</span>
                <SearchIcon className="h-5 w-5" />
              </Link>
              <LoginToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 h-dvh border-t border-border bg-background pt-[5.25rem] lg:hidden">
            <div className="h-full overflow-y-auto px-4 pb-8 pt-4">
              <HeaderNav data={data} mobile onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
