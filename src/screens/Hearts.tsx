import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ImportBanner, MeAvatar, useMyName } from '../components/Account'
import { Avatar } from '../components/Avatar'
import { Fab } from '../components/Fab'
import { HeartScore } from '../components/HeartMeter'
import { Icon } from '../components/Icon'
import { Scene } from '../components/Scene'
import { useData } from '../data/store'
import { countryName, flag } from '../lib/countries'
import { ageOn, formatRange } from '../lib/dates'
import { groupPeople, storyCounts } from '../lib/journal'
import type { Person } from '../lib/types'

export function Hearts() {
  const data = useData()!
  const name = useMyName()
  const [query, setQuery] = useState('')
  const counts = useMemo(() => storyCounts(data.stories), [data.stories])
  const countries = new Set(data.people.flatMap((p) => (p.country ? [p.country] : []))).size

  const q = query.trim().toLocaleLowerCase()
  const groups = useMemo(() => {
    const matches = (p: Person) =>
      p.name.toLocaleLowerCase().includes(q) ||
      p.tags.some((t) => t.toLocaleLowerCase().includes(q)) ||
      (!!p.country && countryName(p.country).toLocaleLowerCase().includes(q))
    return groupPeople(q ? data.people.filter(matches) : data.people)
  }, [data.people, q])

  return (
    <main className="page">
      <header className="screen-head">
        <div>
          <p className="eyebrow">{name ? `Hi, ${name.split(' ')[0]}` : 'Hello'}</p>
          <h1 className="title title--xl">Hearts</h1>
        </div>
        <Link to="/you" className="screen-head__me" aria-label="You">
          <MeAvatar />
        </Link>
      </header>

      <ImportBanner />

      {data.people.length === 0 ? (
        <section className="empty-card">
          <div className="empty-card__art">
            <Scene />
          </div>
          <h2 className="empty-card__title">Who would you like to remember?</h2>
          <p className="empty-card__text">Add the people who’ve been part of your life: a love, a crush, a summer, a friend. Then write down the little stories you shared.</p>
          <Link to="/people/new" className="btn btn--primary btn--lg btn--block">
            Add someone
          </Link>
        </section>
      ) : (
        <>
          <div className="pill-stats">
            <span className="pill-stat pill-stat--sun">
              <b>{data.people.length}</b> {data.people.length === 1 ? 'heart' : 'hearts'}
            </span>
            <Link to="/stories" className="pill-stat pill-stat--lilac">
              <b>{data.stories.length}</b> {data.stories.length === 1 ? 'story' : 'stories'}
            </Link>
            {countries > 0 && (
              <Link to="/map" className="pill-stat pill-stat--sage">
                <b>{countries}</b> {countries === 1 ? 'country' : 'countries'}
              </Link>
            )}
          </div>

          {data.people.length > 5 && (
            <label className="search search--page">
              <Icon name="search" size={20} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search names, words, countries" aria-label="Search hearts" />
            </label>
          )}

          {groups.map((group) => (
            <section key={group.label} className="people-group">
              <h2 className="section-title">{group.label}</h2>
              <div className="stack">
                {group.people.map((p) => (
                  <PersonCard key={p.id} person={p} stories={counts.get(p.id) ?? 0} />
                ))}
              </div>
            </section>
          ))}
          {groups.length === 0 && <p className="empty-note">No one matches “{query}”.</p>}
        </>
      )}

      <Fab to="/people/new" label="Add someone" />
    </main>
  )
}

function PersonCard({ person, stories }: { person: Person; stories: number }) {
  const range = formatRange(person.start, person.end, true)
  return (
    <Link to={`/people/${person.id}`} className="person-card">
      <Avatar person={person} size={60} />
      <span className="person-card__body">
        <span className="person-card__name">
          {person.name || 'Someone'}
          {person.born && <span className="person-card__age">, {ageOn(person.born, person.start)}</span>}
        </span>
        {(range || person.country) && (
          <span className="person-card__meta">
            {person.country && <span className="person-card__flag">{flag(person.country)}</span>}
            {range || (person.country && countryName(person.country))}
          </span>
        )}
        {person.tags.length > 0 && (
          <span className="person-card__tags">
            {person.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="chip chip--xs">
                {tag}
              </span>
            ))}
          </span>
        )}
      </span>
      <span className="person-card__side">
        <HeartScore value={person.rating} />
        {stories > 0 && (
          <span className="person-card__count">
            <Icon name="book" size={14} />
            {stories}
          </span>
        )}
      </span>
    </Link>
  )
}
