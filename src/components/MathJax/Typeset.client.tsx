'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const MATHJAX_SCRIPT_ID = 'mathjax-script'
const MATHJAX_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
const MATH_MARKER_PATTERN = /(\$\$|\\\(|\\\[|\$[^$]+\$)/

type MathJaxLike = {
  startup?: {
    promise?: Promise<unknown>
  }
  typesetClear?: (elements?: Element[]) => void
  typesetPromise?: (elements?: Element[]) => Promise<unknown>
}

declare global {
  interface Window {
    MathJax?: MathJaxLike & Record<string, unknown>
    __mathJaxLoadingPromise__?: Promise<void>
  }
}

const loadMathJax = async () => {
  if (typeof window === 'undefined') return

  if (window.MathJax?.typesetPromise) {
    return
  }

  if (window.__mathJaxLoadingPromise__) {
    await window.__mathJaxLoadingPromise__
    return
  }

  window.MathJax = {
    tex: {
      inlineMath: [
        ['$', '$'],
        ['\\(', '\\)'],
      ],
      displayMath: [
        ['$$', '$$'],
        ['\\[', '\\]'],
      ],
      processEscapes: true,
      processEnvironments: true,
    },
    options: {
      // Avoid rendering TeX delimiters in code-like contexts.
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    },
    startup: {
      typeset: false,
    },
  } as MathJaxLike & Record<string, unknown>

  window.__mathJaxLoadingPromise__ = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(MATHJAX_SCRIPT_ID) as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Failed to load MathJax script')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.id = MATHJAX_SCRIPT_ID
    script.src = MATHJAX_SCRIPT_SRC
    script.async = true
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('Failed to load MathJax script')), {
      once: true,
    })
    document.head.appendChild(script)
  })

  await window.__mathJaxLoadingPromise__
}

const typesetPayloadRichText = async () => {
  if (typeof window === 'undefined') return

  const targets = Array.from(document.querySelectorAll('.payload-richtext')).filter((element) =>
    MATH_MARKER_PATTERN.test(element.textContent || ''),
  )
  if (targets.length === 0) return

  await loadMathJax()

  const mathJax = window.MathJax
  if (!mathJax?.typesetPromise) return

  mathJax.typesetClear?.(targets)
  await mathJax.typesetPromise(targets)
}

export function MathJaxTypeset() {
  const pathname = usePathname()

  useEffect(() => {
    void typesetPayloadRichText()
  }, [pathname])

  return null
}
