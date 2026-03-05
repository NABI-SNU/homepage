import Link from 'next/link'

type BacklinkItem = {
  slug: string
  summary?: string | null
  title: string
}

export function WikiBacklinks({ items }: { items: BacklinkItem[] }) {
  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-border/70 bg-card/50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Backlinks</h2>
        <p className="mt-3 text-sm text-muted-foreground">No backlinks yet.</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-card/50 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Backlinks</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              className="block rounded-lg border border-border/60 bg-background/50 px-3 py-2 transition-colors hover:border-primary/30 hover:bg-muted/50"
              href={`/wiki/${item.slug}`}
            >
              <p className="text-sm font-medium">{item.title}</p>
              {item.summary && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.summary}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

