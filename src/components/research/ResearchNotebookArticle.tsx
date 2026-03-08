import type { NotebookCell, NotebookContent, NotebookOutput } from '@/utilities/notebooks'

import { ResearchNotebookPlot } from '@/components/research/ResearchNotebookPlot.client'
import { renderMystToHtml } from '@/utilities/renderMystToHtml'
import { getPlotlyFigure, normalizeNotebookText } from '@/utilities/notebooks'

type ResearchNotebookArticleProps = {
  downloadURL: string
  filename?: string | null
  notebook: NotebookContent
}

const cellLabelClassName =
  'inline-flex items-center rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground'

const selectPreferredOutput = (data: Record<string, unknown>) => {
  const order = [
    'application/vnd.plotly.v1+json',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
    'text/markdown',
    'text/plain',
    'application/json',
    'text/html',
  ] as const

  for (const key of order) {
    const value = data[key]
    if (typeof value === 'string' || Array.isArray(value) || typeof value === 'object') {
      return { mimeType: key, value }
    }
  }

  const fallback = Object.entries(data)[0]
  if (!fallback) return null

  return {
    mimeType: fallback[0],
    value: fallback[1],
  }
}

const renderMimeValueAsText = (value: unknown): string => {
  if (Array.isArray(value)) return value.join('')
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return JSON.stringify(value, null, 2)
  return ''
}

const renderDisplayOutput = (
  output: Extract<NotebookOutput, { output_type: 'display_data' | 'execute_result' }>,
  key: string,
) => {
  const data = output.data
  if (!data) return null

  const selected = selectPreferredOutput(data)
  if (!selected) return null

  const { mimeType, value } = selected

  if (mimeType === 'application/vnd.plotly.v1+json') {
    const figure = getPlotlyFigure(value)

    if (!figure) return null

    return <ResearchNotebookPlot figure={figure} key={key} />
  }

  if (mimeType.startsWith('image/')) {
    const encoded = typeof value === 'string' ? value : Array.isArray(value) ? value.join('') : null

    if (!encoded) return null

    if (mimeType === 'image/svg+xml') {
      const svgMarkup = Array.isArray(value) ? value.join('') : String(value)
      const svgBase64 = Buffer.from(svgMarkup).toString('base64')

      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt="Notebook output"
          className="h-auto max-h-[32rem] max-w-full rounded-xl border border-border/60 bg-background shadow-sm"
          key={key}
          loading="lazy"
          src={`data:${mimeType};base64,${svgBase64}`}
        />
      )
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt="Notebook output"
        className="h-auto max-h-[32rem] max-w-full rounded-xl border border-border/60 bg-background shadow-sm"
        key={key}
        loading="lazy"
        src={`data:${mimeType};base64,${encoded}`}
      />
    )
  }

  if (mimeType === 'text/markdown') {
    const html = renderMystToHtml(renderMimeValueAsText(value))

    return (
      <div
        className="labs-notebook-markdown prose prose-neutral max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
        key={key}
      />
    )
  }

  if (mimeType === 'text/html') {
    const fallbackText = data['text/plain']

    return (
      <div className="min-w-0 space-y-3" key={key}>
        <p className="text-sm text-muted-foreground">
          Rich HTML output is omitted in this reading view for safety.
        </p>
        {fallbackText ? (
          <pre className="overflow-x-auto rounded-xl border border-border/60 bg-background px-4 py-3 text-sm leading-6 text-foreground">
            <code>{renderMimeValueAsText(fallbackText)}</code>
          </pre>
        ) : null}
      </div>
    )
  }

  return (
    <pre
      className="max-w-full overflow-x-auto rounded-xl border border-border/60 bg-background px-4 py-3 text-sm leading-6 text-foreground"
      key={key}
    >
      <code>{renderMimeValueAsText(value)}</code>
    </pre>
  )
}

const renderOutput = (output: NotebookOutput, index: number) => {
  const key = `output-${index}`

  if (output.output_type === 'stream') {
    const streamText = normalizeNotebookText(output.text)
    if (!streamText.trim()) return null

    return (
      <pre
        className="max-w-full overflow-x-auto rounded-xl border border-border/60 bg-background px-4 py-3 text-sm leading-6 text-foreground"
        key={key}
      >
        <code>{streamText}</code>
      </pre>
    )
  }

  if (output.output_type === 'error') {
    const traceback =
      output.traceback?.join('\n') || `${output.ename || 'Error'}: ${output.evalue || ''}`

    return (
      <pre
        className="max-w-full overflow-x-auto rounded-xl border border-rose-300/70 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-950 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-100"
        key={key}
      >
        <code>{traceback}</code>
      </pre>
    )
  }

  return renderDisplayOutput(output, key)
}

const renderCodeCell = (cell: Extract<NotebookCell, { cell_type: 'code' }>, index: number) => {
  const source = normalizeNotebookText(cell.source)
  const outputs = cell.outputs?.map(renderOutput).filter(Boolean)

  return (
    <section className="labs-notebook-cell min-w-0" key={`code-${index}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={cellLabelClassName}>
          Code {typeof cell.execution_count === 'number' ? `[${cell.execution_count}]` : ''}
        </span>
        {outputs && outputs.length > 0 ? (
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {outputs.length} output{outputs.length === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>

      {source.trim() ? (
        <pre className="mt-4 max-w-full overflow-x-auto rounded-[1.25rem] border border-slate-900/90 bg-slate-950 px-4 py-4 text-sm leading-6 text-slate-100 shadow-lg shadow-slate-950/10">
          <code>{source}</code>
        </pre>
      ) : null}

      {outputs && outputs.length > 0 ? (
        <div className="mt-4 min-w-0 space-y-4 rounded-[1.25rem] border border-border/70 bg-card/70 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Output
          </p>
          <div className="space-y-4">{outputs}</div>
        </div>
      ) : null}
    </section>
  )
}

const renderMarkdownCell = (
  cell: Extract<NotebookCell, { cell_type: 'markdown' | 'raw' }>,
  index: number,
) => {
  const source = normalizeNotebookText(cell.source)
  if (!source.trim()) return null

  if (cell.cell_type === 'raw') {
    return (
      <section className="labs-notebook-cell min-w-0" key={`raw-${index}`}>
        <span className={cellLabelClassName}>Raw</span>
        <pre className="mt-4 max-w-full overflow-x-auto rounded-[1.25rem] border border-border/60 bg-background px-4 py-4 text-sm leading-6 text-foreground">
          <code>{source}</code>
        </pre>
      </section>
    )
  }

  const html = renderMystToHtml(source)

  return (
    <section
      className="labs-notebook-cell labs-notebook-cell--markdown min-w-0"
      key={`markdown-${index}`}
    >
      <div
        className="labs-notebook-markdown prose prose-neutral max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  )
}

const renderCell = (cell: NotebookCell, index: number) => {
  if (cell.cell_type === 'code') return renderCodeCell(cell, index)
  return renderMarkdownCell(cell, index)
}

export function ResearchNotebookArticle({
  downloadURL,
  filename,
  notebook,
}: ResearchNotebookArticleProps) {
  const codeCells = notebook.cells.filter((cell) => cell.cell_type === 'code').length
  const narrativeCells = notebook.cells.filter((cell) => cell.cell_type === 'markdown').length

  return (
    <section className="labs-notebook-shell min-w-0 rounded-[2rem] border border-border/70 bg-card/75 p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur md:p-8">
      <div className="flex flex-col gap-5 border-b border-border/60 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <span className={cellLabelClassName}>Notebook document</span>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Interactive reading view
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              Rendered from the uploaded notebook with MyST-powered narrative parsing and a lighter,
              document-first layout.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <span>
              {narrativeCells} narrative cell{narrativeCells === 1 ? '' : 's'}
            </span>
            <span>
              {codeCells} code cell{codeCells === 1 ? '' : 's'}
            </span>
            {filename ? <span>{filename}</span> : null}
          </div>
        </div>

        <a
          className="inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
          href={downloadURL}
          rel="noreferrer"
          target="_blank"
        >
          Download source notebook
        </a>
      </div>

      <div className="mt-8 min-w-0 space-y-6">{notebook.cells.map(renderCell)}</div>
    </section>
  )
}
