'use client'

import dynamic from 'next/dynamic'

type WikiGraphProps = {
  currentNodeId?: string
  height?: number
  links: Array<{ source: string; target: string }>
  nodes: Array<{ id: string; title: string }>
}

export const WikiGraph = dynamic<WikiGraphProps>(
  () => import('./WikiGraph.client').then((module) => module.WikiGraph),
  {
    loading: () => (
      <div className="h-full min-h-[280px] w-full animate-pulse rounded-xl border border-border/70 bg-card/50" />
    ),
    ssr: false,
  },
)
