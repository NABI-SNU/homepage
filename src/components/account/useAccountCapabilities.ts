'use client'

import { useEffect, useState } from 'react'

type AccountCapabilities = {
  linkedPerson?: {
    id: number
    slug?: string | null
  } | null
  permissions?: {
    canAccessAdmin?: boolean
    canCreatePost?: boolean
    canCreateWiki?: boolean
    canPublishOwnPosts?: boolean
    canPublishOwnWiki?: boolean
  } | null
  user?: {
    id: number
    roles?: string | string[] | null
  } | null
}

export const useAccountCapabilities = () => {
  const [capabilities, setCapabilities] = useState<AccountCapabilities | null>(null)
  const [isResolved, setIsResolved] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadCapabilities = async () => {
      try {
        const response = await fetch('/api/account/capabilities', {
          cache: 'no-store',
          credentials: 'include',
        })

        if (!response.ok) {
          if (isMounted) {
            setCapabilities(null)
            setIsResolved(true)
          }
          return
        }

        const data = (await response.json()) as AccountCapabilities
        if (!isMounted) return

        setCapabilities(data)
        setIsResolved(true)
      } catch {
        if (isMounted) {
          setCapabilities(null)
          setIsResolved(true)
        }
      }
    }

    void loadCapabilities()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    capabilities,
    isResolved,
  }
}
