import Link from 'next/link'

import { WikiBacklinks } from '@/components/wiki/WikiBacklinks'
import { WikiGraph } from '@/components/wiki/WikiGraph'

type WikiSummaryItem = {
  slug: string
  summary?: string | null
  title: string
}

type GraphData = {
  links: Array<{ source: string; target: string }>
  nodes: Array<{ id: string; title: string }>
}

export function WikiPageSidebar({
  backlinks,
  currentSlug,
  graphData,
  outgoing,
  unresolvedTargets,
}: {
  backlinks: WikiSummaryItem[]
  currentSlug: string
  graphData: GraphData
  outgoing: WikiSummaryItem[]
  unresolvedTargets: string[]
}) {
  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border border-border/70 bg-card/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Local Graph
          </h2>
          <Link className="text-xs text-primary hover:underline" href="/wiki/graph">
            Open full graph
          </Link>
        </div>
        <WikiGraph
          currentNodeId={currentSlug}
          height={260}
          links={graphData.links}
          nodes={graphData.nodes}
        />
      </section>

      <WikiBacklinks items={backlinks} />

      <section className="rounded-2xl border border-border/70 bg-card/50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Outgoing Links
        </h2>
        {outgoing.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No outgoing links yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {outgoing.map((item) => (
              <li key={item.slug}>
                <Link
                  className="block rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm transition-colors hover:border-primary/30 hover:bg-muted/50"
                  href={`/wiki/${item.slug}`}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {unresolvedTargets.length > 0 && (
        <section className="rounded-2xl border border-warning bg-warning/30 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
            Unresolved Wiki Links
          </h2>
          <ul className="mt-3 space-y-1">
            {unresolvedTargets.map((target) => (
              <li className="text-sm text-muted-foreground" key={target}>
                [[{target}]]
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  )
}
