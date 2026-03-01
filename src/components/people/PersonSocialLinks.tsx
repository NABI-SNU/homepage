import type { Person } from '@/payload-types'
import { Globe, Github, Linkedin } from 'lucide-react'
import React from 'react'

import { cn } from '@/utilities/ui'

type PersonSocial = NonNullable<NonNullable<Person['socials']>[number]>

const XIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.24 2h3.29l-7.2 8.23L23 22h-6.74l-5.28-6.9L4.95 22H1.66l7.7-8.8L1 2h6.9l4.78 6.32L18.24 2Zm-1.15 18h1.82L6.92 3.9H4.98L17.09 20Z" />
  </svg>
)

const OrcidBadge = ({ className }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={cn(
      'inline-flex items-center justify-center rounded-full border border-current text-[9px] font-bold leading-none',
      className,
    )}
  >
    iD
  </span>
)

const platformIcon = (platform: PersonSocial['platform'], className?: string) => {
  if (platform === 'x') return <XIcon className={className} />
  if (platform === 'github') return <Github className={className} />
  if (platform === 'linkedin') return <Linkedin className={className} />
  if (platform === 'orcid') return <OrcidBadge className={className} />
  return <Globe className={className} />
}

const platformName = (platform: PersonSocial['platform']) => {
  if (platform === 'x') return 'X'
  if (platform === 'github') return 'GitHub'
  if (platform === 'linkedin') return 'LinkedIn'
  if (platform === 'orcid') return 'ORCID'
  return 'Website'
}

type Props = {
  className?: string
  iconOnly?: boolean
  socials: Person['socials']
}

export function PersonSocialLinks({ className, iconOnly = true, socials }: Props) {
  if (!socials || socials.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {socials.map((social, index) => (
        <a
          className={cn(
            'group/social inline-flex items-center rounded-full border border-border/70 text-muted-foreground transition-all duration-300',
            'hover:-translate-y-0.5 hover:scale-110 hover:border-primary/45 hover:text-primary hover:shadow-lg hover:shadow-primary/20',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
            iconOnly ? 'h-11 w-11 justify-center bg-transparent' : 'gap-2 px-3 py-1.5 text-sm bg-card/40 hover:bg-card/60',
          )}
          href={social.url}
          key={`${social.platform}-${social.url}-${index}`}
          rel="noreferrer"
          target="_blank"
          title={social.label || platformName(social.platform)}
        >
          {platformIcon(
            social.platform,
            cn(
              iconOnly ? 'h-5 w-5' : 'h-3.5 w-3.5',
              'transition-transform duration-300 group-hover/social:scale-110',
            ),
          )}
          {!iconOnly && <span>{social.label || platformName(social.platform)}</span>}
        </a>
      ))}
    </div>
  )
}
