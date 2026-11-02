import type { CSSProperties } from 'react'
import { accentOf, initials } from '../lib/journal'
import type { Person } from '../lib/types'
import { Icon } from './Icon'
import { usePhotoUrl } from './Photo'

/** A person's photo, or their initials on their accent colour. */
export function Avatar({ person, size = 48, className = '' }: { person: Pick<Person, 'id' | 'name' | 'photo'>; size?: number; className?: string }) {
  const url = usePhotoUrl(person.photo)
  return (
    <span className={`avatar accent-${accentOf(person.id)} ${className}`} style={{ '--size': `${size}px` } as CSSProperties} aria-hidden="true">
      {url ? (
        <img src={url} alt="" draggable={false} />
      ) : person.name.trim() ? (
        <span className="avatar__initials">{initials(person.name)}</span>
      ) : (
        <Icon name="user" size={Math.round(size * 0.42)} />
      )}
    </span>
  )
}

/** Overlapping avatars for the people in a story. */
export function AvatarStack({ people, size = 28, max = 4 }: { people: Person[]; size?: number; max?: number }) {
  const shown = people.slice(0, max)
  return (
    <span className="avatar-stack">
      {shown.map((p) => (
        <Avatar key={p.id} person={p} size={size} />
      ))}
      {people.length > max && <span className="avatar-stack__more">+{people.length - max}</span>}
    </span>
  )
}
