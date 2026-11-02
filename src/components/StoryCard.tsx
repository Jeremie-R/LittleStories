import { Link } from 'react-router'
import { flag } from '../lib/countries'
import { monthName, parseDay } from '../lib/dates'
import type { Person, Story } from '../lib/types'
import { AvatarStack } from './Avatar'
import { Photo } from './Photo'

/** A story in a timeline: a little calendar tile, the start of the text, photos and who was there. */
export function StoryCard({ story, people, withYear = false }: { story: Story; people: Person[]; withYear?: boolean }) {
  const date = parseDay(story.date)
  const shared = story.people.map((id) => people.find((p) => p.id === id)).filter((p): p is Person => !!p)
  const extra = story.photos.length - 3

  return (
    <Link to={`/stories/${story.id}`} className="story-card">
      <span className="story-card__date" aria-hidden="true">
        <b>{date.getDate()}</b>
        <span>{monthName(date.getMonth())}</span>
        {withYear && <small>{date.getFullYear()}</small>}
      </span>
      <span className="story-card__body">
        {story.title && <span className="story-card__title">{story.title}</span>}
        {story.text && <span className="story-card__text">{story.text}</span>}
        {story.photos.length > 0 && (
          <span className="story-card__photos">
            {story.photos.slice(0, 3).map((id, i) => (
              <span key={id} className="story-card__thumb">
                <Photo id={id} />
                {i === 2 && extra > 0 && <span className="story-card__more">+{extra}</span>}
              </span>
            ))}
          </span>
        )}
        {(shared.length > 0 || story.country || story.tags.length > 0) && (
          <span className="story-card__meta">
            {shared.length > 0 && (
              <>
                <AvatarStack people={shared} size={22} />
                <span className="story-card__names">{shared.map((p) => p.name.split(' ')[0]).join(', ')}</span>
              </>
            )}
            {story.country && <span className="story-card__flag">{flag(story.country)}</span>}
            {story.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="chip chip--xs">
                {tag}
              </span>
            ))}
          </span>
        )}
      </span>
    </Link>
  )
}
