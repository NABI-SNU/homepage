import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'

export function WikiLinkifiedRichText({
  data,
  wikiLinkMap,
}: {
  data: DefaultTypedEditorState
  wikiLinkMap: Record<string, string>
}) {
  return <RichText className="prose-headings:scroll-mt-28" data={data} enableGutter={false} wikiLinkMap={wikiLinkMap} />
}

