'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminLogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    if (isLoading) return

    setIsLoading(true)

    try {
      await Promise.allSettled([
        fetch('/api/auth/sign-out', {
          body: JSON.stringify({}),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        }),
        fetch('/api/users/logout', {
          credentials: 'include',
          method: 'POST',
        }),
      ])
    } finally {
      router.push('/account')
      router.refresh()
    }
  }

  return (
    <button
      className="nav__link"
      disabled={isLoading}
      onClick={() => void handleLogout()}
      style={{
        background: 'none',
        border: 'none',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.7 : 1,
        padding: 0,
        textAlign: 'left',
        width: '100%',
      }}
      type="button"
    >
      <span className="nav__link-label">{isLoading ? 'Logging out...' : 'Log out'}</span>
    </button>
  )
}
