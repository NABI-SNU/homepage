'use client'

import { authClient } from '@/auth/betterAuthClient'
import { PersonAvatar } from '@/components/people/PersonAvatar'
import type { Person } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { CircleUserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useId, useMemo, useRef, useState } from 'react'

type MeUser = {
  email?: string | null
  id?: number | string
  name?: string | null
}

type ProfilePayload = {
  person?: Pick<Person, 'avatar' | 'email' | 'name' | 'slug'> | null
  user?: MeUser | null
}

export const LoginToggle: React.FC<{
  className?: string
}> = ({ className }) => {
  const [profile, setProfile] = useState<ProfilePayload['person']>(null)
  const [personSlug, setPersonSlug] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()
  const { data: session, refetch } = authClient.useSession()
  const user = useMemo<MeUser | null>(() => {
    if (!session?.user) return null

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    }
  }, [session?.user])

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null)
      setPersonSlug(null)
      return
    }

    let isMounted = true

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/account/profile', {
          cache: 'no-store',
          credentials: 'include',
        })

        if (!isMounted) return

        if (!response.ok) {
          setProfile(null)
          setPersonSlug(null)
          return
        }

        const payload = (await response.json()) as ProfilePayload
        setProfile(payload.person ?? null)
        setPersonSlug(payload.person?.slug ?? null)
      } catch {
        if (isMounted) {
          setProfile(null)
          setPersonSlug(null)
        }
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!wrapperRef.current || !(target instanceof Node)) return
      if (!wrapperRef.current.contains(target)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const isAuthenticated = Boolean(user?.id)
  const label = isAuthenticated ? 'Account menu' : 'Authentication menu'
  const logOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: async () => {
          await refetch()
        },
      },
    })

    setProfile(null)
    setPersonSlug(null)
    setIsOpen(false)
  }

  const profileHref = personSlug ? `/people/${personSlug}` : '/account/profile'
  const myPostsHref = personSlug ? `/people/${personSlug}#posts` : '/posts'

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={label}
        className={cn(
          'inline-flex items-center rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
          className,
        )}
        onClick={() => setIsOpen((open) => !open)}
        title={label}
        type="button"
      >
        <span className="sr-only">{label}</span>
        {isAuthenticated ? (
          <PersonAvatar
            avatar={profile?.avatar}
            className="h-6 w-6 border-border/70"
            email={profile?.email || user?.email}
            name={profile?.name || user?.name}
            size={24}
          />
        ) : (
          <CircleUserRound className="h-5 w-5" />
        )}
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-48 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xl"
        >
          {!isAuthenticated ? (
            <>
              <Link
                className="block rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                href="/account?mode=signup"
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                Sign In
              </Link>
              <Link
                className="block rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                href="/account?mode=login"
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                Log In
              </Link>
            </>
          ) : (
            <>
              <Link
                className="block rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                href="/account"
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                My Account
              </Link>
              <Link
                className="block rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                href={profileHref}
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                Profile
              </Link>
              <Link
                className="block rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                href={myPostsHref}
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                My Posts
              </Link>
              <button
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                onClick={() => void logOut()}
                role="menuitem"
                type="button"
              >
                Log Out
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
