'use client'

import { cn } from '@/utilities/ui'
import React, { useEffect, useMemo, useState } from 'react'

type TocItem = {
  id: string
  level: number
  text: string
}

type Props = {
  contentSelector?: string
  minHeadings?: number
}

const HEADING_SELECTOR = 'h2, h3, h4'
const OBSERVER_TOP_OFFSET = 112

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export function TableOfContents({
  contentSelector = '[data-post-content]',
  minHeadings = 3,
}: Props) {
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const container = document.querySelector(contentSelector)

    if (!container) {
      setItems([])
      return
    }

    const headings = Array.from(container.querySelectorAll(HEADING_SELECTOR))
      .filter((heading): heading is HTMLHeadingElement => heading instanceof HTMLHeadingElement)
      .filter((heading) => Boolean(heading.textContent?.trim()))

    const slugCounts = new Map<string, number>()
    const mapped: TocItem[] = headings.map((heading) => {
      const text = heading.textContent?.trim() || ''
      const baseId = heading.id || slugify(text) || 'section'
      const count = (slugCounts.get(baseId) || 0) + 1
      slugCounts.set(baseId, count)
      const id = count > 1 ? `${baseId}-${count}` : baseId

      if (!heading.id || heading.id !== id) {
        heading.id = id
      }

      return {
        id,
        text,
        level: Number(heading.tagName.replace('H', '')) || 2,
      }
    })

    if (mapped.length < minHeadings) {
      setItems([])
      return
    }

    setItems(mapped)
    setActiveId((current) => current || mapped[0]?.id || '')
  }, [contentSelector, minHeadings])

  useEffect(() => {
    if (items.length === 0) return

    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((target): target is HTMLElement => Boolean(target))

    if (targets.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        rootMargin: `-${OBSERVER_TOP_OFFSET}px 0px -65% 0px`,
        threshold: [0, 1],
      },
    )

    targets.forEach((target) => observer.observe(target))

    const updateFromScroll = () => {
      let current = targets[0]?.id || ''

      for (const target of targets) {
        const top = target.getBoundingClientRect().top
        if (top <= OBSERVER_TOP_OFFSET) current = target.id
      }

      if (current) setActiveId(current)
    }

    updateFromScroll()
    window.addEventListener('scroll', updateFromScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updateFromScroll)
    }
  }, [items])

  useEffect(() => {
    if (!isOpen) return

    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const panel = document.getElementById('toc-panel')
      const toggle = document.getElementById('toc-toggle')

      if (!panel || !toggle) return
      if (!panel.contains(target) && !toggle.contains(target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', onClickOutside)

    return () => document.removeEventListener('click', onClickOutside)
  }, [isOpen])

  const lineClasses = useMemo(
    () =>
      items.map((item) => {
        if (item.level <= 2) return 'w-5 h-0.5'
        if (item.level === 3) return 'ml-1 w-4 h-0.5'
        return 'ml-2 w-3 h-px'
      }),
    [items],
  )

  if (items.length === 0) return null

  return (
    <>
      <aside
        id="toc-panel"
        className={cn(
          'fixed left-[max(1rem,calc((100vw-72rem)/2-18rem))] top-1/2 z-30 hidden w-64 -translate-y-1/2 rounded-xl border border-border/80 bg-background/95 shadow-xl backdrop-blur-md transition-all duration-300 md:block',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <div className="p-4">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Contents</p>
          <nav className="max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={cn(
                      'block rounded-md border-l-2 px-3 py-2 text-sm transition-colors',
                      item.level === 2 ? 'pl-3 font-medium' : item.level === 3 ? 'pl-6 text-muted-foreground' : 'pl-8 text-xs text-muted-foreground/90',
                      activeId === item.id
                        ? 'border-primary bg-muted text-foreground'
                        : 'border-transparent hover:text-primary',
                    )}
                    onClick={(event) => {
                      event.preventDefault()
                      const target = document.getElementById(item.id)
                      if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }}
                  >
                    <span className="line-clamp-2">{item.text}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      <button
        id="toc-toggle"
        aria-expanded={isOpen}
        aria-label="Toggle table of contents"
        className={cn(
          'fixed left-[max(1rem,calc((100vw-72rem)/2-21rem))] top-1/2 z-40 hidden -translate-y-1/2 rounded-lg border border-border/60 bg-background/70 p-3 opacity-75 shadow-lg backdrop-blur-sm transition-all duration-200 hover:opacity-100 md:block',
          isOpen ? 'pointer-events-none scale-95 opacity-0' : 'pointer-events-auto opacity-75',
        )}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span className="sr-only">Table of contents</span>
        <span className="flex flex-col gap-2">
          {lineClasses.map((lineClass, index) => (
            <span
              key={`${items[index]?.id || index}-line`}
              className={cn(
                'block origin-left bg-muted-foreground transition-all duration-200',
                lineClass,
                activeId === items[index]?.id ? 'scale-110 bg-primary' : '',
              )}
            />
          ))}
        </span>
      </button>
    </>
  )
}
