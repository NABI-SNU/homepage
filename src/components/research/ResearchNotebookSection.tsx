'use client'

import dynamic from 'next/dynamic'

type ResearchNotebookSectionProps = {
  apiURL: string
  colabURL?: string | null
  downloadURL: string
  filename?: string | null
  kaggleURL?: string | null
}

const ResearchNotebook = dynamic(() => import('@/components/research/ResearchNotebook.client'), {
  loading: () => (
    <section className="mt-10 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold">Notebook</h2>
      <div className="mt-6 rounded-2xl border border-dashed border-border bg-background/80 p-8">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-muted/70" />
      </div>
    </section>
  ),
  ssr: false,
})

export function ResearchNotebookSection(props: ResearchNotebookSectionProps) {
  return <ResearchNotebook {...props} />
}
