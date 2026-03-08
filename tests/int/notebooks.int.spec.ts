import { describe, expect, it } from 'vitest'

import { getPlotlyFigure } from '@/utilities/notebooks'

describe('getPlotlyFigure', () => {
  it('returns a normalized Plotly figure from notebook mime output', () => {
    const figure = getPlotlyFigure({
      config: {
        responsive: true,
      },
      data: [{ type: 'scatter', x: [1, 2], y: [3, 4] }],
      layout: {
        title: {
          text: 'Demo',
        },
      },
    })

    expect(figure).toEqual({
      config: {
        responsive: true,
      },
      data: [{ type: 'scatter', x: [1, 2], y: [3, 4] }],
      frames: undefined,
      layout: {
        title: {
          text: 'Demo',
        },
      },
    })
  })

  it('rejects non-object plotly values', () => {
    expect(getPlotlyFigure('nope')).toBeNull()
    expect(getPlotlyFigure(['nope'])).toBeNull()
  })
})
