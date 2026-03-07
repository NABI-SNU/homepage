'use client'

import Link from 'next/link'

import { useAccountCapabilities } from '@/components/account/useAccountCapabilities'
import { cn } from '@/utilities/ui'

type WikiSelfServiceActionsProps = {
  className?: string
  ownerUserID?: number | null
  wikiID?: number | string | null
}

export function WikiSelfServiceActions({
  className,
  ownerUserID,
  wikiID,
}: WikiSelfServiceActionsProps) {
  const { capabilities, isResolved } = useAccountCapabilities()
  const canCreateWiki = capabilities?.permissions?.canCreateWiki === true
  const canEditThisWiki =
    (typeof wikiID === 'number' || typeof wikiID === 'string') &&
    typeof ownerUserID === 'number' &&
    Number.isFinite(ownerUserID) &&
    typeof capabilities?.user?.id === 'number' &&
    capabilities.user.id === ownerUserID

  if (!isResolved || (!canCreateWiki && !canEditThisWiki)) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {canEditThisWiki && (
        <Link
          className="inline-flex items-center rounded-full border border-[#006FFE] bg-[#006FFE] px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
          href={`/admin/collections/wiki/${wikiID}`}
        >
          Edit this wiki page
        </Link>
      )}
      {canCreateWiki && (
        <Link
          className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-muted"
          href="/admin/collections/wiki/create"
        >
          Create wiki page
        </Link>
      )}
    </div>
  )
}
