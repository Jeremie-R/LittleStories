import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { Avatar } from '../components/Avatar'
import { Fab } from '../components/Fab'
import { HeartMeter } from '../components/HeartMeter'
import { Icon } from '../components/Icon'
import { Lightbox } from '../components/Lightbox'
import { Photo } from '../components/Photo'
import { SharedThings } from '../components/SharedThings'
import { StoryCard } from '../components/StoryCard'
import { useData } from '../data/store'
import { countryName, flag } from '../lib/countries'
import { formatDuration, formatRange } from '../lib/dates'
import { useBack } from '../lib/hooks'
import { accentOf, ageLine, periodsOf, storiesOf, totalDays } from '../lib/journal'
import { facebookLink, linkedinLink } from '../lib/links'

export function PersonDetail() {
  const { id } = useParams()
  const data = useData()!
  const back = useBack('/')
  const [viewing, setViewing] = useState<number | null>(null)
  const person = data.people.find((p) => p.id === id)
  if (!person) return <Navigate to="/" replace />

  const stories = storiesOf(data, person.id)
  const photos = stories.flatMap((s) => s.photos)
  const others = data.people.filter((p) => p.id !== person.id)
  const periods = periodsOf(person)
  const ranges = periods.map((p) => formatRange(p.start, p.end, periods.length > 1)).filter(Boolean)
  const duration = person.start && (periods.length > 1 || person.end !== person.start) ? formatDuration(totalDays(person)) : null
  const age = ageLine(person)
  const phone = person.phone?.replace(/[^\d+]/g, '')
  const facebook = facebookLink(person.facebook)
  const linkedin = linkedinLink(person.linkedin)

  return (
    <main className={`page page--detail accent-${accentOf(person.id)}`}>
      <header className="topbar">
        <button className="icon-btn" onClick={back} aria-label="Back">
          <Icon name="back" />
        </button>
        <Link to={`/people/${person.id}/edit`} className="icon-btn" aria-label="Edit">
          <Icon name="pencil" />
        </Link>
      </header>

      <section className="profile">
        <Avatar person={person} size={148} className="profile__avatar" />
        {ranges.map((range, i) => (
          <p key={i} className="profile__date">
            {range}
          </p>
        ))}
        <h1 className="title title--xl title--center">{person.name || 'Someone'}</h1>
        {age && <p className="profile__age">{age}</p>}
        {person.tags.length > 0 && (
          <div className="chip-row chip-row--wrap chip-row--center">
            {person.tags.map((tag) => (
              <span key={tag} className="chip">
                {tag}
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="facts">
        {person.rating && (
          <div className="fact fact--sun">
            <HeartMeter value={person.rating} size={30} />
            <b>{person.rating}/10</b>
          </div>
        )}
        <div className="fact fact--lilac">
          <span className="fact__big">{stories.length}</span>
          <span>{stories.length === 1 ? 'story' : 'stories'}</span>
        </div>
        {person.country && (
          <div className="fact fact--sage">
            <span className="fact__big">{flag(person.country)}</span>
            <span>{countryName(person.country)}</span>
          </div>
        )}
        {duration && (
          <div className="fact fact--blush">
            <span className="fact__big fact__big--text">{duration}</span>
            <span>{person.end ? 'together' : 'so far'}</span>
          </div>
        )}
      </div>

      {person.about && (
        <section className="card prose">
          <p>{person.about}</p>
        </section>
      )}

      {(person.instagram || facebook || linkedin || phone) && (
        <div className="link-row">
          {person.instagram && (
            <a className="link-pill" href={`https://instagram.com/${person.instagram}`} target="_blank" rel="noreferrer">
              <Icon name="instagram" size={18} />@{person.instagram}
            </a>
          )}
          {facebook && (
            <a className="link-pill" href={facebook} target="_blank" rel="noreferrer">
              <Icon name="facebook" size={18} />
              Facebook
            </a>
          )}
          {linkedin && (
            <a className="link-pill" href={linkedin} target="_blank" rel="noreferrer">
              <Icon name="linkedin" size={18} />
              LinkedIn
            </a>
          )}
          {phone && (
            <>
              <a className="link-pill" href={`tel:${phone}`}>
                <Icon name="phone" size={18} />
                Call
              </a>
              <a className="link-pill" href={`sms:${phone}`}>
                <Icon name="message" size={18} />
                Message
              </a>
            </>
          )}
        </div>
      )}

      <SharedThings person={person} />

      {photos.length > 0 && (
        <section>
          <h2 className="section-title">Photos</h2>
          <div className="gallery">
            {photos.map((photo, i) => (
              <button key={photo} className="gallery__item" onClick={() => setViewing(i)} aria-label={`Photo ${i + 1}`}>
                <Photo id={photo} />
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">Stories</h2>
        {stories.length === 0 ? (
          <p className="empty-inline">No stories yet. Tap + to write the first one.</p>
        ) : (
          <div className="stack">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} people={others} withYear />
            ))}
          </div>
        )}
      </section>

      <Fab to={`/stories/new?with=${person.id}`} label="Write a story" docked />
      {viewing !== null && <Lightbox photos={photos} start={viewing} onClose={() => setViewing(null)} />}
    </main>
  )
}
