import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Fab } from '../components/Fab'
import { Icon } from '../components/Icon'
import { Scene } from '../components/Scene'
import { StoryCard } from '../components/StoryCard'
import { useData } from '../data/store'
import { countryName } from '../lib/countries'
import { dayKey, formatMonth, monthName } from '../lib/dates'
import { byMonth } from '../lib/journal'
import type { Story } from '../lib/types'

const anchor = (month: string) => `month-${month}`

export function Stories() {
  const data = useData()!
  const [query, setQuery] = useState('')
  const q = query.trim().toLocaleLowerCase()

  const stories = useMemo(() => {
    if (!q) return data.stories
    const names = new Map(data.people.map((p) => [p.id, p.name.toLocaleLowerCase()]))
    const matches = (s: Story) =>
      (s.title ?? '').toLocaleLowerCase().includes(q) ||
      s.text.toLocaleLowerCase().includes(q) ||
      s.tags.some((t) => t.toLocaleLowerCase().includes(q)) ||
      s.people.some((id) => names.get(id)?.includes(q)) ||
      (!!s.country && countryName(s.country).toLocaleLowerCase().includes(q))
    return data.stories.filter(matches)
  }, [data.stories, data.people, q])

  const groups = useMemo(() => byMonth(stories), [stories])
  const perMonth = useMemo(() => new Map(groups.map((g) => [g.month, g.stories.length])), [groups])
  const years = useMemo(() => {
    const all = new Set([dayKey().slice(0, 4), ...data.stories.map((s) => s.date.slice(0, 4))])
    return [...all].sort()
  }, [data.stories])

  const [year, setYear] = useState(() => groups[0]?.month.slice(0, 4) ?? dayKey().slice(0, 4))
  const [current, setCurrent] = useState<string | null>(null)

  // Follow the month being read, so the calendar shows where you are when you scroll back up.
  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        let inView: string | null = null
        for (const g of groups) {
          const el = document.getElementById(anchor(g.month))
          if (el && el.getBoundingClientRect().top < 120) inView = g.month
        }
        setCurrent(inView)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [groups])

  const jump = (month: string) => {
    setCurrent(month)
    document.getElementById(anchor(month))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const yearIndex = years.indexOf(year)

  return (
    <main className="page">
      <header className="screen-head">
        <div>
          <p className="eyebrow">
            {data.stories.length} {data.stories.length === 1 ? 'story' : 'stories'}
          </p>
          <h1 className="title title--xl">Stories</h1>
        </div>
      </header>

      {data.stories.length === 0 ? (
        <section className="empty-card">
          <div className="empty-card__art">
            <Scene variant="dusk" />
          </div>
          <h2 className="empty-card__title">Your first little story</h2>
          <p className="empty-card__text">A first date, a trip, a silly night, a quiet morning. Write down a moment before it fades.</p>
          <Link to="/stories/new" className="btn btn--primary btn--lg btn--block">
            Write a story
          </Link>
        </section>
      ) : (
        <>
          <section className="month-nav" aria-label="Jump to a month">
            <div className="month-nav__head">
              <button className="icon-btn icon-btn--plain" onClick={() => setYear(years[yearIndex - 1])} disabled={yearIndex <= 0} aria-label="Previous year">
                <Icon name="back" size={20} />
              </button>
              <b className="month-nav__year">{year}</b>
              <button className="icon-btn icon-btn--plain" onClick={() => setYear(years[yearIndex + 1])} disabled={yearIndex >= years.length - 1} aria-label="Next year">
                <Icon name="chevron" size={20} />
              </button>
            </div>
            <div className="month-nav__grid">
              {Array.from({ length: 12 }, (_, i) => {
                const month = `${year}-${String(i + 1).padStart(2, '0')}`
                const count = perMonth.get(month) ?? 0
                return (
                  <button key={month} className="month" disabled={!count} aria-current={month === current || undefined} onClick={() => jump(month)} aria-label={`${formatMonth(month)}: ${count} ${count === 1 ? 'story' : 'stories'}`}>
                    <span className="month__name">{monthName(i)}</span>
                    <span className="month__dot">{count || ''}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {data.stories.length > 5 && (
            <label className="search search--page">
              <Icon name="search" size={20} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search stories, people, tags" aria-label="Search stories" />
            </label>
          )}

          {groups.map((group) => (
            <section key={group.month} id={anchor(group.month)} className="month-group">
              <h2 className="month-group__title">
                <button
                  onClick={() => {
                    setYear(group.month.slice(0, 4))
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  {formatMonth(group.month)}
                  <span>{group.stories.length}</span>
                </button>
              </h2>
              <div className="stack">
                {group.stories.map((story) => (
                  <StoryCard key={story.id} story={story} people={data.people} />
                ))}
              </div>
            </section>
          ))}
          {groups.length === 0 && <p className="empty-note">No story matches “{query}”.</p>}
        </>
      )}

      <Fab to="/stories/new" label="Write a story" />
    </main>
  )
}
