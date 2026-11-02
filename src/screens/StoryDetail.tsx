import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { Avatar } from '../components/Avatar'
import { useConfirm } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { Lightbox } from '../components/Lightbox'
import { Photo } from '../components/Photo'
import { deleteStory, useData } from '../data/store'
import { countryName, flag } from '../lib/countries'
import { formatDay } from '../lib/dates'
import { useBack } from '../lib/hooks'
import type { Person } from '../lib/types'

export function StoryDetail() {
  const { id } = useParams()
  const data = useData()!
  const navigate = useNavigate()
  const back = useBack('/stories')
  const confirm = useConfirm()
  const [viewing, setViewing] = useState<number | null>(null)
  const [deleted, setDeleted] = useState(false)
  const story = data.stories.find((s) => s.id === id)
  // Just deleted: we're already on our way back.
  if (!story) return deleted ? null : <Navigate to="/stories" replace />

  const people = story.people.map((pid) => data.people.find((p) => p.id === pid)).filter((p): p is Person => !!p)

  const remove = async () => {
    const ok = await confirm({ title: 'Delete this story?', message: story.photos.length ? 'Its photos will be deleted too.' : undefined, confirmLabel: 'Delete', danger: true })
    if (!ok) return
    setDeleted(true)
    deleteStory(story.id)
    back()
  }

  return (
    <main className="page page--detail">
      <header className="topbar">
        <button className="icon-btn" onClick={back} aria-label="Back">
          <Icon name="back" />
        </button>
      </header>

      <section className="story-head">
        <p className="story-head__date">{formatDay(story.date)}</p>
        {story.title && <h1 className="title title--xl title--center">{story.title}</h1>}
        {story.tags.length > 0 && (
          <div className="chip-row chip-row--wrap chip-row--center">
            {story.tags.map((tag) => (
              <span key={tag} className="chip">
                {tag}
              </span>
            ))}
          </div>
        )}
      </section>

      {story.photos.length > 0 && (
        <div className={`carousel ${story.photos.length === 1 ? 'carousel--single' : ''}`}>
          {story.photos.map((photo, i) => (
            <button key={photo} className="carousel__item" onClick={() => setViewing(i)} aria-label={`Open photo ${i + 1}`}>
              <Photo id={photo} />
            </button>
          ))}
        </div>
      )}

      {story.text && (
        <article className="prose prose--story">
          {story.text.split(/\n{2,}/).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </article>
      )}

      {(people.length > 0 || story.country) && (
        <section className="story-facts">
          {people.map((p) => (
            <Link key={p.id} to={`/people/${p.id}`} className="person-chip person-chip--link">
              <Avatar person={p} size={28} />
              <span>{p.name}</span>
            </Link>
          ))}
          {story.country && (
            <span className="person-chip">
              <span className="person-chip__flag">{flag(story.country)}</span>
              <span>{countryName(story.country)}</span>
            </span>
          )}
        </section>
      )}

      <div className="action-dock">
        <button className="round-btn" onClick={() => navigate(`/stories/${story.id}/edit`)} aria-label="Edit">
          <Icon name="pencil" />
        </button>
        <button className="round-btn round-btn--danger" onClick={remove} aria-label="Delete">
          <Icon name="trash" />
        </button>
      </div>

      {viewing !== null && <Lightbox photos={story.photos} start={viewing} onClose={() => setViewing(null)} />}
    </main>
  )
}
