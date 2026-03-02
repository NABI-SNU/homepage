import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children
}
