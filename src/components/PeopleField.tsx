import { useState } from 'react'
import { latestRange, sortPeople } from '../lib/journal'
import type { Person } from '../lib/types'
import { Avatar } from './Avatar'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

/** Who a story is with: the chosen people as chips, and a sheet to pick from everyone. */
export function PeopleField({ people, value, onChange }: { people: Person[]; value: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const chosen = value.map((id) => people.find((p) => p.id === id)).filter((p): p is Person => !!p)
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])

  const q = query.trim().toLocaleLowerCase()
  const listed = sortPeople(people).filter((p) => !q || p.name.toLocaleLowerCase().includes(q))

  return (
    <>
      <div className="people-field">
        {chosen.map((p) => (
          <button key={p.id} type="button" className="person-chip" onClick={() => toggle(p.id)} aria-label={`Remove ${p.name}`}>
            <Avatar person={p} size={28} />
            <span>{p.name}</span>
            <Icon name="x" size={14} strokeWidth={2.4} />
          </button>
        ))}
        <button type="button" className="person-chip person-chip--add" onClick={() => setOpen(true)} disabled={people.length === 0}>
          <Icon name="plus" size={18} strokeWidth={2.2} />
          <span>{chosen.length ? 'Add' : 'Choose who it’s with'}</span>
        </button>
      </div>
      {people.length === 0 && <p className="field-hint">Add someone on the Hearts tab to link them to stories.</p>}
      <Sheet
        open={open}
        title="Who was there?"
        onClose={() => setOpen(false)}
        footer={
          <button type="button" className="btn btn--primary btn--block" onClick={() => setOpen(false)}>
            Done
          </button>
        }
      >
        {people.length > 6 && (
          <label className="search">
            <Icon name="search" size={20} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search people" />
          </label>
        )}
        <div className="pick-list">
          {listed.map((p) => (
            <button key={p.id} type="button" className="pick-row" aria-pressed={value.includes(p.id)} onClick={() => toggle(p.id)}>
              <Avatar person={p} size={40} />
              <span className="pick-row__name">
                {p.name}
                {(p.start || p.end) && <small>{latestRange(p)}</small>}
              </span>
              <span className="check">{value.includes(p.id) && <Icon name="check" size={16} strokeWidth={2.8} />}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}
