import { Facebook, Linkedin, Mail, Twitter } from 'lucide-react'

import { getServerSideURL } from '@/utilities/getURL'

type Props = {
  text: string
  url: string | URL
  className?: string
}

const toAbsoluteURL = (url: string | URL): string => {
  if (url instanceof URL) return url.toString()

  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const baseURL = getServerSideURL()
  const normalizedPath = url.startsWith('/') ? url : `/${url}`

  return `${baseURL}${normalizedPath}`
}

export function SocialShare({ text, url, className = 'inline-flex items-center gap-3' }: Props) {
  const shareURL = toAbsoluteURL(url)
  const encodedText = encodeURIComponent(text)
  const encodedURL = encodeURIComponent(shareURL)

  return (
    <div className={className}>
      <span className="align-super font-bold text-slate-500 dark:text-slate-400">Share:</span>

      <a
        className="text-gray-400 transition-colors hover:text-black dark:text-slate-500 dark:hover:text-slate-300"
        href={`https://twitter.com/intent/tweet?url=${encodedURL}&text=${encodedText}`}
        rel="noopener noreferrer"
        target="_blank"
        title="Twitter Share"
      >
        <Twitter className="h-6 w-6" />
      </a>

      <a
        className="text-gray-400 transition-colors hover:text-black dark:text-slate-500 dark:hover:text-slate-300"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedURL}`}
        rel="noopener noreferrer"
        target="_blank"
        title="Facebook Share"
      >
        <Facebook className="h-6 w-6" />
      </a>

      <a
        className="text-gray-400 transition-colors hover:text-black dark:text-slate-500 dark:hover:text-slate-300"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedURL}`}
        rel="noopener noreferrer"
        target="_blank"
        title="Linkedin Share"
      >
        <Linkedin className="h-6 w-6" />
      </a>

      <a
        className="text-gray-400 transition-colors hover:text-black dark:text-slate-500 dark:hover:text-slate-300"
        href={`mailto:?subject=${encodedText}&body=${encodedURL}`}
        title="Email Share"
      >
        <Mail className="h-6 w-6" />
      </a>
    </div>
  )
}
