import { mystParse } from 'myst-parser'
import { mystToHtml } from 'myst-to-html'

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

export const renderMystToHtml = (markdown: string): string => {
  if (!markdown.trim()) return ''

  try {
    return mystToHtml(mystParse(markdown), {
      formatHtml: true,
      hast: {
        allowDangerousHtml: false,
      },
      stringifyHtml: {
        allowDangerousHtml: false,
      },
    })
  } catch {
    return `<pre>${escapeHtml(markdown)}</pre>`
  }
}
