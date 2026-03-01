import Image from 'next/image'

import type { Person } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { md5 } from '@/utilities/md5'
import { cn } from '@/utilities/ui'

type Props = {
  avatar?: Person['avatar']
  className?: string
  email?: string | null
  name?: string | null
  size?: number
}

const getInitials = (name?: string | null) => {
  return (
    (name || 'User')
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U'
  )
}

const gravatarURL = (email: string | null | undefined, name: string | null | undefined, size: number) => {
  const normalized =
    email?.trim().toLowerCase().normalize('NFKC') || name?.trim().toLowerCase().normalize('NFKC') || 'unknown'
  const hash = md5(normalized)
  const requestedSize = Math.min(Math.max(Math.round(size * 2), 80), 2048)
  return `https://secure.gravatar.com/avatar/${hash}?s=${requestedSize}&d=identicon&r=g`
}

export function PersonAvatar({ avatar, className, email, name, size = 48 }: Props) {
  const avatarSource =
    avatar && typeof avatar === 'object' && avatar.url
      ? getMediaUrl(avatar.url, avatar.updatedAt || null)
      : gravatarURL(email, name, size)

  const initials = getInitials(name)
  const alt = name?.trim() ? `${name} avatar` : 'Profile avatar'

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted text-muted-foreground',
        className,
      )}
      style={{ height: `${size}px`, width: `${size}px` }}
    >
      <Image
        alt={alt}
        className="h-full w-full object-cover"
        height={size}
        src={avatarSource}
        width={size}
      />
      <span className="sr-only">{initials}</span>
    </div>
  )
}
