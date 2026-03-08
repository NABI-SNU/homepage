'use client'

import { useEffect, useRef, useState } from 'react'

import type { PlotlyFigure } from '@/utilities/notebooks'

type PlotlyLike = {
  Plots?: {
    resize: (root: HTMLDivElement) => void
  }
  purge: (root: HTMLDivElement) => void
  react: (
    root: HTMLDivElement,
    data: unknown[],
    layout?: Record<string, unknown>,
    config?: Record<string, unknown>,
  ) => Promise<unknown> | unknown
}

let plotlyModulePromise: Promise<PlotlyLike> | null = null

const getPlotlyModule = async (): Promise<PlotlyLike> => {
  if (!plotlyModulePromise) {
    plotlyModulePromise = import('plotly.js-dist-min').then(
      (module) => module.default as PlotlyLike,
    )
  }

  return plotlyModulePromise
}

export function ResearchNotebookPlot({ figure }: { figure: PlotlyFigure }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [renderError, setRenderError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let plotly: PlotlyLike | null = null
    const root = containerRef.current

    if (!root) return

    const renderPlot = async () => {
      try {
        plotly = await getPlotlyModule()
        if (!mounted || !root) return

        setRenderError(null)

        await plotly.react(
          root,
          figure.data || [],
          {
            autosize: true,
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            ...figure.layout,
          },
          {
            displaylogo: false,
            responsive: true,
            ...figure.config,
          },
        )
      } catch {
        if (mounted) {
          setRenderError('Interactive plot could not be rendered.')
        }
      }
    }

    const handleResize = () => {
      if (!plotly || !containerRef.current) return
      plotly.Plots?.resize(containerRef.current)
    }

    window.addEventListener('resize', handleResize)
    void renderPlot()

    return () => {
      mounted = false
      window.removeEventListener('resize', handleResize)

      if (plotly && root) {
        plotly.purge(root)
      }
    }
  }, [figure])

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Interactive Plotly figure
        </p>
      </div>
      <div className="overflow-hidden rounded-[1.25rem] border border-border/60 bg-background p-2 shadow-sm">
        <div
          className="min-h-[22rem] w-full max-w-full"
          data-testid="notebook-plotly-figure"
          ref={containerRef}
        />
      </div>
      {renderError ? <p className="text-sm text-muted-foreground">{renderError}</p> : null}
    </div>
  )
}
