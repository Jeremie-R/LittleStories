import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { Segmented } from '../components/Segmented'
import { StoryCard } from '../components/StoryCard'
import { WorldMap } from '../components/WorldMap'
import { useData } from '../data/store'
import { countryName, flag } from '../lib/countries'
import { countByCountry, latestRange, sortPeople, sortStories, type MapMode } from '../lib/journal'

const LEGEND = [
  { level: 1, label: '1' },
  { level: 2, label: '2' },
  { level: 3, label: '3–4' },
  { level: 4, label: '5+' },
]

export function MapScreen() {
  const data = useData()!
  const [mode, setMode] = useState<MapMode>('people')
  const [selected, setSelected] = useState<string>()
  const counts = useMemo(() => countByCountry(data, mode), [data, mode])
  const ranked = useMemo(
    () => [...counts].sort((a, b) => b[1] - a[1] || countryName(a[0]).localeCompare(countryName(b[0]))),
    [counts],
  )
  const max = ranked[0]?.[1] ?? 1
  const tone = mode === 'people' ? 'coral' : 'periwinkle'

  return (
    <main className="page">
      <header className="screen-head">
        <div>
          <p className="eyebrow">
            {counts.size} {counts.size === 1 ? 'country' : 'countries'}
          </p>
          <h1 className="title title--xl">Map</h1>
        </div>
      </header>

      <Segmented<MapMode>
        label="Show"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'people', label: 'Hearts' },
          { value: 'stories', label: 'Stories' },
        ]}
      />
      <p className="map-caption">{mode === 'people' ? 'Where the people in your life are from' : 'Where your stories happened'}</p>

      <WorldMap counts={counts} tone={tone} selected={selected} onSelect={setSelected} />

      <div className={`map-legend map-legend--${tone}`} aria-label="Legend">
        {LEGEND.map((item) => (
          <span key={item.level} className="map-legend__item">
            <i className={`level-${item.level}`} />
            {item.label}
          </span>
        ))}
      </div>

      {selected && <CountryPanel code={selected} mode={mode} onClose={() => setSelected(undefined)} />}

      <h2 className="section-title">Countries</h2>
      {ranked.length === 0 ? (
        <p className="empty-inline">
          {mode === 'people' ? 'Add where someone is from on their page to see it here.' : 'Add where a story happened to see it here.'}
        </p>
      ) : (
        <div className={`rank-list rank-list--${tone}`}>
          {ranked.map(([code, count]) => (
            <button
              key={code}
              className="rank-row"
              aria-pressed={selected === code}
              onClick={() => {
                setSelected(code)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <span className="rank-row__flag">{flag(code)}</span>
              <span className="rank-row__body">
                <span className="rank-row__name">{countryName(code)}</span>
                <span className="rank-row__bar" style={{ '--pct': `${(count / max) * 100}%` } as CSSProperties} />
              </span>
              <b className="rank-row__count">{count}</b>
            </button>
          ))}
        </div>
      )}
    </main>
  )
}

function CountryPanel({ code, mode, onClose }: { code: string; mode: MapMode; onClose: () => void }) {
  const data = useData()!
  const people = sortPeople(data.people.filter((p) => p.country === code))
  const stories = sortStories(data.stories.filter((s) => s.country === code))
  const empty = mode === 'people' ? people.length === 0 : stories.length === 0

  return (
    <section className="country-panel">
      <header className="country-panel__head">
        <span className="country-panel__flag">{flag(code)}</span>
        <h2 className="country-panel__name">{countryName(code)}</h2>
        <button className="icon-btn icon-btn--plain" onClick={onClose} aria-label="Close">
          <Icon name="x" size={20} />
        </button>
      </header>
      {empty && <p className="empty-inline">{mode === 'people' ? 'No one from here yet.' : 'No stories here yet.'}</p>}
      {mode === 'people' &&
        people.map((p) => (
          <Link key={p.id} to={`/people/${p.id}`} className="mini-person">
            <Avatar person={p} size={40} />
            <span className="mini-person__body">
              <b>{p.name}</b>
              {(p.start || p.end) && <span>{latestRange(p)}</span>}
            </span>
            <Icon name="chevron" size={18} />
          </Link>
        ))}
      {mode === 'stories' && (
        <div className="stack">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} people={data.people} withYear />
          ))}
        </div>
      )}
    </section>
  )
}
