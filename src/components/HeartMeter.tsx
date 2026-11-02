import { useId, type CSSProperties } from 'react'

// A heart spanning y = 4 to 21 in a 24 × 24 box, so the fill level maps straight onto it.
const HEART =
  'M12 21C12 21 3 15.5 3 9.25C3 6.35 5.35 4 8.25 4C9.9 4 11.2 4.85 12 6.05C12.8 4.85 14.1 4 15.75 4C18.65 4 21 6.35 21 9.25C21 15.5 12 21 12 21Z'
const TOP = 4
const HEIGHT = 17

/** One heart filled from the bottom to `value` out of 10. */
export function HeartMeter({ value, size = 20, className = '' }: { value?: number; size?: number; className?: string }) {
  const clip = 'heart' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const level = Math.max(0, Math.min(10, value ?? 0)) / 10
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={`heart-meter ${className}`} aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <rect x="0" y={TOP + (1 - level) * HEIGHT} width="24" height={HEIGHT * level + 1} />
        </clipPath>
      </defs>
      <path d={HEART} className="heart-meter__empty" />
      <path d={HEART} className="heart-meter__fill" clipPath={`url(#${clip})`} />
    </svg>
  )
}

/** The heart with its score, for cards and profiles. */
export function HeartScore({ value, size = 18 }: { value?: number; size?: number }) {
  if (!value) return null
  return (
    <span className="heart-score" aria-label={`${value} out of 10`}>
      <HeartMeter value={value} size={size} />
      <span>{value}</span>
    </span>
  )
}

const WORDS = ['Not rated', 'A tiny spark', 'A tiny spark', 'Warm', 'Warm', 'Sweet', 'Sweet', 'Very special', 'Very special', 'Deeply loved', 'All my heart']

export function HeartInput({ value, onChange }: { value?: number; onChange: (value: number | undefined) => void }) {
  const current = value ?? 0
  return (
    <div className="heart-input">
      <HeartMeter value={current} size={68} className="heart-input__heart" />
      <div className="heart-input__body">
        <p className="heart-input__value">
          {current ? (
            <>
              <b>{current}</b>
              <span>/10</span>
            </>
          ) : (
            <span>–</span>
          )}
          <em>{WORDS[current]}</em>
        </p>
        <input
          type="range"
          className="range"
          min={0}
          max={10}
          step={1}
          value={current}
          aria-label="How much they mean to you, out of 10"
          style={{ '--pct': `${current * 10}%` } as CSSProperties}
          onChange={(e) => onChange(Number(e.target.value) || undefined)}
        />
      </div>
    </div>
  )
}
