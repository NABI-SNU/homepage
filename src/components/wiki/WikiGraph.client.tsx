'use client'

import { Tween as Tweened, Group as TweenGroup } from '@tweenjs/tween.js'
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  select,
  zoom,
  zoomIdentity,
  type D3ZoomEvent,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3'
import { Application, Container, Graphics, Text } from 'pixi.js'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef } from 'react'

type WikiGraphNode = {
  id: string
  title: string
}

type WikiGraphLink = {
  source: string
  target: string
}

type RenderNode = {
  gfx: Graphics
  isCurrent: boolean
  label: Text
  radius: number
  simulationData: WikiGraphNode & SimulationNodeDatum
}

type RenderLink = {
  gfx: Graphics
  simulationData: SimulationLinkDatum<WikiGraphNode & SimulationNodeDatum> & {
    source: WikiGraphNode & SimulationNodeDatum
    target: WikiGraphNode & SimulationNodeDatum
  }
}

const getNodeRadius = (degree: number) => 4 + Math.min(10, Math.sqrt(degree + 1) * 1.6)

type GraphPalette = {
  label: number
  linkNear: number
  linkFar: number
  nodeDefaultFill: number
  nodeDefaultStroke: number
  nodeCurrentFill: number
  nodeCurrentStroke: number
}

const colorFromRGBString = (value: string): number => {
  const channels = value.match(/\d+(\.\d+)?/g)
  if (!channels || channels.length < 3) return 0

  const [r, g, b] = channels.slice(0, 3).map((channel) => {
    const parsed = Math.round(Number(channel))
    return Math.max(0, Math.min(255, Number.isFinite(parsed) ? parsed : 0))
  })

  return (r << 16) | (g << 8) | b
}

const resolveCSSColor = (value: string, fallback: string): string => {
  const probe = document.createElement('span')
  probe.style.color = fallback
  probe.style.color = value
  document.body.appendChild(probe)
  const resolved = window.getComputedStyle(probe).color
  probe.remove()
  return resolved || fallback
}

const getColorFromVar = (styles: CSSStyleDeclaration, variable: string, fallback: string): number => {
  const cssVarValue = styles.getPropertyValue(variable).trim()
  const normalizedColor = resolveCSSColor(cssVarValue || fallback, fallback)
  return colorFromRGBString(normalizedColor)
}

const resolveGraphPalette = (): GraphPalette => {
  const styles = window.getComputedStyle(document.documentElement)

  return {
    label: getColorFromVar(styles, '--muted-foreground', 'rgb(120 120 120)'),
    linkNear: getColorFromVar(styles, '--muted-foreground', 'rgb(120 120 120)'),
    linkFar: getColorFromVar(styles, '--border', 'rgb(180 180 180)'),
    nodeDefaultFill: getColorFromVar(styles, '--primary', 'rgb(99 102 241)'),
    nodeDefaultStroke: getColorFromVar(styles, '--primary', 'rgb(99 102 241)'),
    nodeCurrentFill: getColorFromVar(styles, '--accent', 'rgb(236 72 153)'),
    nodeCurrentStroke: getColorFromVar(styles, '--foreground', 'rgb(35 35 35)'),
  }
}

export function WikiGraph({
  currentNodeId,
  height = 440,
  links,
  nodes,
}: {
  currentNodeId?: string
  height?: number
  links: WikiGraphLink[]
  nodes: WikiGraphNode[]
}) {
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement | null>(null)

  const graphData = useMemo(() => ({ links, nodes }), [links, nodes])

  useEffect(() => {
    const root = rootRef.current
    if (!root || graphData.nodes.length === 0) return

    let disposed = false
    const width = root.clientWidth || 960
    const graphHeight = Math.max(280, height)
    const degreeByID = new Map<string, number>()

    graphData.links.forEach((link) => {
      degreeByID.set(link.source, (degreeByID.get(link.source) || 0) + 1)
      degreeByID.set(link.target, (degreeByID.get(link.target) || 0) + 1)
    })

    const simulatedNodes = graphData.nodes.map((node) => ({
      ...node,
      x: width / 2 + (Math.random() - 0.5) * 80,
      y: graphHeight / 2 + (Math.random() - 0.5) * 80,
    }))

    const simulatedLinks = graphData.links
      .map((link) => {
        const source = simulatedNodes.find((node) => node.id === link.source)
        const target = simulatedNodes.find((node) => node.id === link.target)
        if (!source || !target) return null
        return { source, target }
      })
      .filter(Boolean) as RenderLink['simulationData'][]

    const simulation = forceSimulation(simulatedNodes)
      .force(
        'link',
        forceLink(simulatedLinks)
          .id((node) => String((node as { id: string }).id))
          .distance(90),
      )
      .force('charge', forceManyBody().strength(-180))
      .force('center', forceCenter(width / 2, graphHeight / 2))

    const app = new Application()
    let raf = 0
    let themeObserver: MutationObserver | null = null
    const hoverTweens = new TweenGroup()

    const setup = async () => {
      await app.init({
        antialias: true,
        autoDensity: true,
        autoStart: false,
        backgroundAlpha: 0,
        eventMode: 'static',
        height: graphHeight,
        preference: 'webgl',
        resolution: window.devicePixelRatio,
        width,
      })
      if (disposed) return

      root.innerHTML = ''
      root.appendChild(app.canvas)

      const stage = app.stage
      stage.interactive = false

      const linksContainer = new Container<Graphics>({ zIndex: 1, isRenderGroup: true })
      const nodesContainer = new Container<Graphics>({ zIndex: 2, isRenderGroup: true })
      const labelsContainer = new Container<Text>({ zIndex: 3, isRenderGroup: true })
      stage.addChild(linksContainer, nodesContainer, labelsContainer)

      const renderedNodes: RenderNode[] = []
      const renderedLinks: RenderLink[] = []
      let palette = resolveGraphPalette()

      const applyNodeStyles = (renderedNode: RenderNode) => {
        const fillColor = renderedNode.isCurrent ? palette.nodeCurrentFill : palette.nodeDefaultFill
        const strokeColor = renderedNode.isCurrent
          ? palette.nodeCurrentStroke
          : palette.nodeDefaultStroke
        const strokeWidth = renderedNode.isCurrent ? 2 : 1
        const existingAlpha = renderedNode.gfx.alpha

        renderedNode.gfx.clear()
        renderedNode.gfx.circle(0, 0, renderedNode.radius)
        renderedNode.gfx.fill({ color: fillColor })
        renderedNode.gfx.stroke({ color: strokeColor, width: strokeWidth })
        renderedNode.gfx.alpha = existingAlpha

        renderedNode.label.style.fill = palette.label
      }

      const refreshPalette = () => {
        palette = resolveGraphPalette()
        renderedNodes.forEach((renderedNode) => {
          applyNodeStyles(renderedNode)
        })
      }

      const updateFocus = (hoveredID: string | null) => {
        const activeNodeIDs = new Set<string>()
        if (hoveredID) {
          activeNodeIDs.add(hoveredID)
          renderedLinks.forEach((renderedLink) => {
            const sourceID = renderedLink.simulationData.source.id
            const targetID = renderedLink.simulationData.target.id
            if (sourceID === hoveredID || targetID === hoveredID) {
              activeNodeIDs.add(sourceID)
              activeNodeIDs.add(targetID)
            }
          })
        }

        hoverTweens.removeAll()

        renderedNodes.forEach((renderedNode) => {
          const baseAlpha = !hoveredID || activeNodeIDs.has(renderedNode.simulationData.id) ? 1 : 0.2
          hoverTweens.add(new Tweened(renderedNode.gfx).to({ alpha: baseAlpha }, 160).start())
          hoverTweens.add(
            new Tweened(renderedNode.label).to({ alpha: hoveredID ? (baseAlpha > 0.9 ? 0.9 : 0.2) : 0.65 }, 160).start(),
          )
        })

        renderedLinks.forEach((renderedLink) => {
          const sourceID = renderedLink.simulationData.source.id
          const targetID = renderedLink.simulationData.target.id
          const active = !hoveredID || sourceID === hoveredID || targetID === hoveredID
          hoverTweens.add(new Tweened(renderedLink.gfx).to({ alpha: active ? 0.85 : 0.15 }, 160).start())
        })
      }

      simulatedNodes.forEach((node) => {
        const degree = degreeByID.get(node.id) || 0
        const radius = getNodeRadius(degree)
        const isCurrent = node.id === currentNodeId
        const gfx = new Graphics({
          cursor: 'pointer',
          eventMode: 'static',
          interactive: true,
        })

        const label = new Text({
          alpha: 0.65,
          anchor: { x: 0.5, y: 1.45 },
          eventMode: 'none',
          style: {
            fill: palette.label,
            fontFamily: 'var(--font-geist-mono)',
            fontSize: 11,
          },
          text: node.title,
        })

        gfx.on('pointerover', () => updateFocus(node.id))
        gfx.on('pointerout', () => updateFocus(null))
        gfx.on('pointertap', () => router.push(`/wiki/${node.id}`))

        nodesContainer.addChild(gfx)
        labelsContainer.addChild(label)

        const renderedNode: RenderNode = {
          gfx,
          isCurrent,
          label,
          radius,
          simulationData: node,
        }
        applyNodeStyles(renderedNode)
        renderedNodes.push(renderedNode)
      })

      simulatedLinks.forEach((link) => {
        const gfx = new Graphics({
          alpha: 0.85,
          eventMode: 'none',
          interactive: false,
        })
        linksContainer.addChild(gfx)
        renderedLinks.push({ gfx, simulationData: link })
      })

      let transform = zoomIdentity
      themeObserver = new MutationObserver((mutations) => {
        const themeChanged = mutations.some(
          (mutation) => mutation.type === 'attributes' && mutation.attributeName === 'data-theme',
        )
        if (themeChanged) {
          refreshPalette()
        }
      })
      themeObserver.observe(document.documentElement, {
        attributeFilter: ['data-theme'],
        attributes: true,
      })

      select<HTMLCanvasElement, unknown>(app.canvas).call(
        zoom<HTMLCanvasElement, unknown>()
          .extent([
            [0, 0],
            [width, graphHeight],
          ])
          .scaleExtent([0.4, 3.5])
          .on('zoom', (event: D3ZoomEvent<HTMLCanvasElement, unknown>) => {
            const nextTransform = event.transform as typeof zoomIdentity
            transform = nextTransform
            stage.scale.set(nextTransform.k, nextTransform.k)
            stage.position.set(nextTransform.x, nextTransform.y)
          }),
      )

      const animate = (time: number) => {
        if (disposed) return

        simulation.tick()

        renderedNodes.forEach((renderedNode) => {
          const x = renderedNode.simulationData.x || width / 2
          const y = renderedNode.simulationData.y || graphHeight / 2
          renderedNode.gfx.position.set(x, y)
          renderedNode.label.position.set(x, y)
        })

        renderedLinks.forEach((renderedLink) => {
          const sourceX = renderedLink.simulationData.source.x || width / 2
          const sourceY = renderedLink.simulationData.source.y || graphHeight / 2
          const targetX = renderedLink.simulationData.target.x || width / 2
          const targetY = renderedLink.simulationData.target.y || graphHeight / 2
          renderedLink.gfx.clear()
          renderedLink.gfx.moveTo(sourceX, sourceY)
          renderedLink.gfx.lineTo(targetX, targetY)
          renderedLink.gfx.stroke({
            alpha: renderedLink.gfx.alpha,
            color: transform.k > 1.4 ? palette.linkNear : palette.linkFar,
            width: transform.k > 1.4 ? 1.4 : 1,
          })
        })

        hoverTweens.update(time)
        app.renderer.render(stage)
        raf = requestAnimationFrame(animate)
      }

      updateFocus(null)
      raf = requestAnimationFrame(animate)
    }

    void setup()

    return () => {
      disposed = true
      if (raf) cancelAnimationFrame(raf)
      themeObserver?.disconnect()
      simulation.stop()
      app.destroy()
    }
  }, [currentNodeId, graphData, height, router])

  return <div className="h-full min-h-[280px] w-full rounded-xl border border-border/70 bg-card/50" ref={rootRef} />
}
