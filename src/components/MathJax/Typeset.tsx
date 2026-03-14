'use client'

import dynamic from 'next/dynamic'

type MathJaxTypesetProps = {
  selector?: string
}

export const MathJaxTypeset = dynamic<MathJaxTypesetProps>(
  () => import('./Typeset.client').then((module) => module.MathJaxTypeset),
  {
    ssr: false,
  },
)
