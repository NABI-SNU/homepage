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
        className="mr-1 inline-block h-[25px] w-[25px] dark:hidden"
        height={25}
        loading={loading}
        priority={priority === 'high'}
        sizes="25px"
        src="/nabi-brand-icon.svg"
        width={25}
      />
      <Image
        alt="NABI"
        className="mr-1 hidden h-[25px] w-[25px] dark:inline-block"
        height={25}
        loading={loading}
        priority={priority === 'high'}
        sizes="25px"
        src="/nabi-brand-icon-dark.svg"
        width={25}
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
