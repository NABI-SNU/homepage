'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useTheme } from '@/providers/Theme'
import { cn } from '@/utilities/ui'
import { Moon, Sun } from 'lucide-react'
import React from 'react'

export const ThemeToggle: React.FC<{
  className?: string
}> = ({ className }) => {
  const { setTheme, theme } = useTheme()
  const { setHeaderTheme } = useHeaderTheme()
  const isDark = theme === 'dark'
  const nextTheme = isDark ? 'light' : 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      aria-label={label}
      className={cn(
        'inline-flex items-center rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
        className,
      )}
      onClick={() => {
        setHeaderTheme(null)
        setTheme(nextTheme)
      }}
      title={label}
      type="button"
    >
      <span className="sr-only">{label}</span>
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
