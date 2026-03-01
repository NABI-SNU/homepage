import clsx from 'clsx'
import Image from 'next/image'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
  showText?: boolean
}

export const Logo = (props: Props) => {
  const { className, loading = 'lazy', priority = 'auto', showText = true } = props

  return (
    <span
      className={clsx(
        'inline-flex items-center whitespace-nowrap text-2xl font-bold text-foreground md:text-xl',
        className,
      )}
    >
      <Image
        alt="NABI"
        className="mr-1 inline-block h-5 w-5"
        height={20}
        loading={loading}
        priority={priority === 'high'}
        src="/favicon.svg"
        width={20}
      />
      {showText && (
        <>
          <span className="hidden md:inline">NABI Labs</span>
          <span className="md:hidden">NABI</span>
        </>
      )}
    </span>
  )
}
