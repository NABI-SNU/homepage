'use client'

import type { NotebookContent } from '@/utilities/notebooks'

import { useTheme } from '@/providers/Theme'
import { ServiceManagerLess } from '@datalayer/jupyter-react/jupyter'
import { Notebook } from '@datalayer/jupyter-react/notebook'
import { JupyterReactTheme } from '@datalayer/jupyter-react/theme'
import { useEffect, useId, useMemo, useState } from 'react'

type ResearchNotebookProps = {
  apiURL: string
  colabURL?: string | null
  downloadURL: string
  filename?: string | null
  kaggleURL?: string | null
}

type NotebookState =
  | {
      notebook: null
      status: 'error'
    }
  | {
      notebook: null
      status: 'loading'
    }
  | {
      notebook: NotebookContent
      status: 'ready'
    }

const actionClassName =
  'inline-flex items-center rounded-full border border-border px-3 py-1.5 text-sm font-medium transition hover:border-primary/40 hover:text-primary'

export default function ResearchNotebook({
  apiURL,
  colabURL,
  downloadURL,
  filename,
  kaggleURL,
}: ResearchNotebookProps) {
  const { theme } = useTheme()
  const [state, setState] = useState<NotebookState>({
    notebook: null,
    status: 'loading',
  })
  const notebookID = useId().replace(/:/g, '-')
  const serviceManager = useMemo(() => new ServiceManagerLess(), [])
  const notebookColormode = theme === 'dark' ? 'dark' : 'light'

  useEffect(() => {
    const controller = new AbortController()

    const loadNotebook = async () => {
      try {
        const response = await fetch(apiURL, {
          cache: 'force-cache',
          credentials: 'same-origin',
          signal: controller.signal,
        })

        if (!response.ok) {
          setState({ notebook: null, status: 'error' })
          return
        }

        const notebook = (await response.json()) as NotebookContent
        setState({ notebook, status: 'ready' })
      } catch (error) {
        if (controller.signal.aborted) return
        console.error('[research-notebook] failed to load notebook', error)
        setState({ notebook: null, status: 'error' })
      }
    }

    void loadNotebook()

    return () => {
      controller.abort()
    }
  }, [apiURL])

  useEffect(() => {
    return () => {
      serviceManager.dispose()
    }
  }, [serviceManager])

  return (
    <section className="mt-10 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Notebook</h2>
          {filename ? <p className="mt-2 text-sm text-muted-foreground">{filename}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <a className={actionClassName} href={downloadURL} rel="noreferrer" target="_blank">
            Download .ipynb
          </a>
          {colabURL ? (
            <a className={actionClassName} href={colabURL} rel="noreferrer" target="_blank">
              Open in Colab
            </a>
          ) : null}
          {kaggleURL ? (
            <a className={actionClassName} href={kaggleURL} rel="noreferrer" target="_blank">
              Open in Kaggle
            </a>
          ) : null}
        </div>
      </div>

      {state.status === 'loading' ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-background/80 p-8">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-64 animate-pulse rounded-xl bg-muted/70" />
        </div>
      ) : null}

      {state.status === 'error' ? (
        <p className="mt-4 text-sm text-amber-600">Notebook content could not be loaded.</p>
      ) : null}

      {state.status === 'ready' ? (
        <div className="research-notebook-viewer mt-6 overflow-hidden rounded-2xl border border-border bg-background">
          <JupyterReactTheme
            backgroundColor="var(--color-background)"
            colormode={notebookColormode}
          >
            <Notebook
              cellSidebarMargin={0}
              height="72vh"
              id={notebookID}
              maxHeight="72vh"
              nbformat={state.notebook as never}
              readonly
              serviceManager={serviceManager}
            />
          </JupyterReactTheme>
        </div>
      ) : null}
    </section>
  )
}
