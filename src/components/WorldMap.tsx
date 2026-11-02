import { geoEqualEarth, geoPath } from 'd3-geo'
import { select } from 'd3-selection'
import 'd3-transition'
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom'
import type { Feature, FeatureCollection, Geometry, Polygon } from 'geojson'
import { useEffect, useRef, useState } from 'react'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import mapUrl from 'world-atlas/countries-50m.json?url'
import { codeForShape } from '../lib/countries'
import { Icon } from './Icon'

const WIDTH = 1000
const MAX_ZOOM = 14

interface Shape {
  key: string
  code: string | undefined
  d: string
  bounds: [[number, number], [number, number]]
}

interface Projected {
  height: number
  shapes: Shape[]
}

// Natural Earth 1:50m (via world-atlas): small countries like Malta or Singapore are there too.
// Fetched the first time the map is shown, then cached by the service worker.
let loading: Promise<Projected> | null = null

function loadMap(): Promise<Projected> {
  loading ??= fetch(mapUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Map ${response.status}`)
      return response.json() as Promise<Topology<{ countries: GeometryCollection<{ name: string }> }>>
    })
    .then((topology) => {
      const all = feature(topology, topology.objects.countries) as FeatureCollection<Geometry, { name: string }>
      const features = all.features.filter((f) => f.id !== '010') // Antarctica
      const world: FeatureCollection = { type: 'FeatureCollection', features }
      const projection = geoEqualEarth().fitWidth(WIDTH, world)
      const path = geoPath(projection)
      const height = Math.ceil(path.bounds(world)[1][1])
      // Zooming to a country frames its largest landmass, so France's overseas regions
      // don't make it zoom out to half the world.
      const mainBounds = (f: Feature<Geometry, { name: string }>) => {
        if (f.geometry.type !== 'MultiPolygon') return path.bounds(f)
        const polygons: Polygon[] = f.geometry.coordinates.map((coordinates) => ({ type: 'Polygon', coordinates }))
        return path.bounds(polygons.reduce((a, b) => (path.area(b) > path.area(a) ? b : a)))
      }
      const shapes = features.map((f: Feature<Geometry, { name: string }>, i) => ({
        key: `${f.id ?? f.properties.name}-${i}`,
        code: codeForShape(f.id, f.properties.name),
        d: path(f) ?? '',
        bounds: mainBounds(f),
      }))
      return { height, shapes }
    })
  loading.catch(() => (loading = null))
  return loading
}

export type MapTone = 'coral' | 'periwinkle'

/** Colour step for a count: 0 = grey, then 1, 2, 3–4, 5+. */
export const level = (count: number) => (count <= 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4)

/**
 * A flat world map with each country grey, or coloured by how many people (or stories)
 * it holds. Pinch, drag and the buttons zoom. On a phone one finger scrolls the page
 * until you zoom in, so the map never traps the scroll.
 */
export function WorldMap({
  counts,
  tone,
  selected,
  onSelect,
}: {
  counts: Map<string, number>
  tone: MapTone
  selected?: string
  onSelect: (code: string | undefined) => void
}) {
  const [map, setMap] = useState<Projected | null>(null)
  const [failed, setFailed] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const layer = useRef<SVGGElement>(null)
  const behavior = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const scale = useRef(1)

  useEffect(() => {
    let cancelled = false
    loadMap()
      .then((m) => cancelled || setMap(m))
      .catch((error) => {
        console.error('Could not load the map', error)
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!map || !svg) return
    const zoomer = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_ZOOM])
      .translateExtent([
        [0, 0],
        [WIDTH, map.height],
      ])
      .filter((event: Event) => {
        if (event.type === 'wheel') return (event as WheelEvent).ctrlKey || (event as WheelEvent).metaKey
        if (event.type === 'touchstart') return (event as TouchEvent).touches.length > 1 || scale.current > 1
        return !(event as MouseEvent).button
      })
      .on('zoom', (event) => {
        scale.current = event.transform.k
        layer.current?.setAttribute('transform', event.transform.toString())
        svg.style.setProperty('--k', String(event.transform.k))
        // Zoomed in, a finger pans the map; zoomed out, it scrolls the page.
        svg.style.touchAction = event.transform.k > 1.01 ? 'none' : 'pan-y'
      })
    behavior.current = zoomer
    const selection = select(svg).call(zoomer)
    svg.style.touchAction = 'pan-y'
    return () => {
      selection.on('.zoom', null)
    }
  }, [map])

  // Zoom to the selected country.
  useEffect(() => {
    const svg = svgRef.current
    if (!map || !svg || !behavior.current || !selected) return
    const parts = map.shapes.filter((s) => s.code === selected)
    if (!parts.length) return
    // Some countries are drawn in a few shapes (Cyprus, Somalia): frame them all.
    const x0 = Math.min(...parts.map((p) => p.bounds[0][0]))
    const y0 = Math.min(...parts.map((p) => p.bounds[0][1]))
    const x1 = Math.max(...parts.map((p) => p.bounds[1][0]))
    const y1 = Math.max(...parts.map((p) => p.bounds[1][1]))
    const k = Math.max(1, Math.min(8, 0.5 / Math.max((x1 - x0) / WIDTH, (y1 - y0) / map.height)))
    const t = zoomIdentity
      .translate(WIDTH / 2, map.height / 2)
      .scale(k)
      .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
    select(svg).transition().duration(600).call(behavior.current.transform, t)
  }, [map, selected])

  const zoomBy = (factor: number) => {
    if (svgRef.current && behavior.current) select(svgRef.current).transition().duration(300).call(behavior.current.scaleBy, factor)
  }
  const reset = () => {
    onSelect(undefined)
    if (svgRef.current && behavior.current) select(svgRef.current).transition().duration(500).call(behavior.current.transform, zoomIdentity)
  }

  if (failed) {
    return (
      <div className="world-map world-map--empty">
        <p>The map couldn’t load. Check your connection and try again.</p>
      </div>
    )
  }

  return (
    <div className={`world-map world-map--${tone}`}>
      {map ? (
        <svg
          ref={svgRef}
          className="world-map__svg"
          viewBox={`0 0 ${WIDTH} ${map.height}`}
          role="img"
          aria-label="World map"
          onClick={(e) => {
            const code = (e.target as Element).closest('path')?.getAttribute('data-code')
            onSelect(code && code !== selected ? code : undefined)
          }}
        >
          <g ref={layer}>
            {map.shapes.map((shape) => (
              <path
                key={shape.key}
                d={shape.d}
                data-code={shape.code}
                className={`world-map__country level-${level(shape.code ? counts.get(shape.code) ?? 0 : 0)}`}
                aria-current={(!!shape.code && shape.code === selected) || undefined}
              />
            ))}
          </g>
        </svg>
      ) : (
        <div className="world-map__loading" aria-busy="true" />
      )}
      <div className="world-map__controls">
        <button className="map-btn" onClick={() => zoomBy(1.8)} aria-label="Zoom in">
          <Icon name="plus" size={18} strokeWidth={2.2} />
        </button>
        <button className="map-btn" onClick={() => zoomBy(1 / 1.8)} aria-label="Zoom out">
          <Icon name="minus" size={18} strokeWidth={2.2} />
        </button>
        <button className="map-btn" onClick={reset} aria-label="Show the whole world">
          <Icon name="expand" size={16} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  )
}
