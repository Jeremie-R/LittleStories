// Flat illustrations in the spirit of the moodboard: a smiling heart rising over soft hills.

const HEART = 'M12 21C12 21 3 15.5 3 9.25C3 6.35 5.35 4 8.25 4C9.9 4 11.2 4.85 12 6.05C12.8 4.85 14.1 4 15.75 4C18.65 4 21 6.35 21 9.25C21 15.5 12 21 12 21Z'

const PALETTES = {
  day: { sky: '#ffc53d', rays: '#f7a21b', heart: '#f2764e', far: '#b9cd5f', near: '#8eab3d', tree: '#5d7d2a', cloud: '#fff6dd' },
  dusk: { sky: '#cdc3f6', rays: '#b2a5ef', heart: '#f2764e', far: '#9fb4e8', near: '#7d8fd6', tree: '#5263a8', cloud: '#efeafe' },
  blush: { sky: '#f8d3c6', rays: '#f2b3a0', heart: '#e2574c', far: '#e9b49b', near: '#d98f73', tree: '#a8573f', cloud: '#fff1ea' },
}

export type SceneVariant = keyof typeof PALETTES

export function Scene({ variant = 'day', className = '' }: { variant?: SceneVariant; className?: string }) {
  const c = PALETTES[variant]
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2
    return { x1: 160 + Math.cos(a) * 52, y1: 104 + Math.sin(a) * 52, x2: 160 + Math.cos(a) * 64, y2: 104 + Math.sin(a) * 64 }
  })
  return (
    <svg className={`scene ${className}`} viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="320" height="220" fill={c.sky} />
      <g stroke={c.rays} strokeWidth="5" strokeLinecap="round">
        {rays.map((r, i) => (
          <line key={i} {...r} />
        ))}
      </g>
      <g className="scene__heart">
        <path d={HEART} fill={c.heart} transform="translate(119.5 58) scale(3.4)" />
        <ellipse cx="149" cy="100" rx="3.2" ry="4.2" fill="#3b2418" />
        <ellipse cx="171" cy="100" rx="3.2" ry="4.2" fill="#3b2418" />
        <path d="M152 110q8 7 16 0" stroke="#3b2418" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="140" cy="109" r="5" fill="#fff" opacity="0.28" />
        <circle cx="180" cy="109" r="5" fill="#fff" opacity="0.28" />
      </g>
      <path d="M28 70a14 14 0 0126-6 11 11 0 0118 9H24a8 8 0 014-3z" fill={c.cloud} />
      <path d="M232 54a12 12 0 0122-4 9 9 0 0115 7h-40a7 7 0 013-3z" fill={c.cloud} />
      <g stroke="#3b2418" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7">
        <path d="M84 104q4-4 8 0q4-4 8 0" />
        <path d="M232 92q3-3 6 0q3-3 6 0" />
        <path d="M250 106q3-3 6 0q3-3 6 0" />
      </g>
      <path d="M0 158c46-26 104-26 150-8s112 14 170-10v80H0z" fill={c.far} />
      <g fill={c.tree}>
        <path d="M30 168l12-44 12 44z" />
        <path d="M50 170l9-32 9 32z" />
        <path d="M266 162l11-40 11 40z" />
        <path d="M286 164l8-28 8 28z" />
      </g>
      <path d="M0 190c60-28 130-24 186-6s96 10 134-4v40H0z" fill={c.near} />
    </svg>
  )
}
