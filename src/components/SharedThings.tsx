import { useEffect, useState } from 'react'
import { savePerson } from '../data/store'
import { fetchPreview, findLink, isPlayable, type LinkPreview } from '../lib/shared'
import { newId, type Person, type SharedThing } from '../lib/types'
import { useConfirm } from './Feedback'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

/** The picture, else the site's icon, else its first letter. Pictures live on other sites and can disappear. */
function Thumb({ thing }: { thing: LinkPreview }) {
  const [failed, setFailed] = useState<string[]>([])
  const usable = (src?: string) => src && !failed.includes(src)
  const src = usable(thing.image) ? thing.image : usable(thing.icon) ? thing.icon : undefined
  const isIcon = src !== undefined && src === thing.icon && src !== thing.image

  return (
    <span className={`shared-thumb ${isIcon ? 'shared-thumb--icon' : ''}`} aria-hidden="true">
      {src ? <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed((f) => [...f, src])} /> : thing.site[0]?.toUpperCase()}
      {!isIcon && src && isPlayable(thing.url) && (
        <span className="shared-thumb__play">
          <Icon name="play" size={16} filled strokeWidth={1.5} />
        </span>
      )}
    </span>
  )
}

function AddSheet({ onAdd, onClose }: { onAdd: (thing: SharedThing) => void; onClose: () => void }) {
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<LinkPreview | null>(null)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const link = findLink(text)

  useEffect(() => {
    setPreview(null)
    if (!link) return
    let cancelled = false
    setBusy(true)
    const id = window.setTimeout(async () => {
      const found = await fetchPreview(link)
      if (cancelled) return
      setPreview(found)
      setTitle(found.title)
      setBusy(false)
    }, 350)
    return () => {
      cancelled = true
      window.clearTimeout(id)
      setBusy(false)
    }
  }, [link])

  const add = () => {
    if (preview) onAdd({ ...preview, id: newId(), title: title.trim() || preview.site, addedAt: Date.now() })
  }

  return (
    <Sheet
      open
      title="Share something"
      onClose={onClose}
      footer={
        <button className="btn btn--primary btn--block btn--lg" onClick={add} disabled={!preview}>
          {busy ? 'Looking it up…' : 'Add'}
        </button>
      }
    >
      <div className="shared-form">
        <input
          className="input"
          inputMode="url"
          autoCapitalize="none"
          autoComplete="off"
          placeholder="Paste a link"
          aria-label="Link"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {preview ? (
          <div className="shared-preview">
            <Thumb key={preview.url} thing={preview} />
            <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" placeholder="Title" />
          </div>
        ) : (
          <p className="field-hint">Your song, a video, a place, a recipe: anything that reminds you of them.</p>
        )}
      </div>
    </Sheet>
  )
}

/** Songs, videos and any other links that belong with someone. */
export function SharedThings({ person }: { person: Person }) {
  const confirm = useConfirm()
  const [adding, setAdding] = useState(false)
  const things = person.shared ?? []

  const add = (thing: SharedThing) => {
    savePerson({ ...person, shared: [thing, ...things] })
    setAdding(false)
  }

  const remove = async (thing: SharedThing) => {
    const ok = await confirm({ title: 'Remove this link?', message: thing.title, confirmLabel: 'Remove', danger: true })
    if (ok) savePerson({ ...person, shared: things.filter((t) => t.id !== thing.id) })
  }

  return (
    <section>
      <div className="section-head">
        <h2 className="section-title">Shared things</h2>
        {things.length > 0 && (
          <button type="button" className="chip chip--add" onClick={() => setAdding(true)}>
            <Icon name="plus" size={14} strokeWidth={2.4} />
            Add
          </button>
        )}
      </div>
      {things.length === 0 ? (
        <button type="button" className="shared-empty" onClick={() => setAdding(true)}>
          <Icon name="music" />
          Add your song, a video, or any link
        </button>
      ) : (
        <div className="stack">
          {things.map((thing) => (
            <div key={thing.id} className="shared-card">
              <a className="shared-card__link" href={thing.url} target="_blank" rel="noreferrer">
                <Thumb thing={thing} />
                <span className="shared-card__body">
                  <span className="shared-card__title">{thing.title}</span>
                  {thing.site !== thing.title && <span className="shared-card__site">{thing.site}</span>}
                </span>
              </a>
              <button type="button" className="icon-btn icon-btn--plain" onClick={() => remove(thing)} aria-label={`Remove ${thing.title}`}>
                <Icon name="x" size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
      {adding && <AddSheet onAdd={add} onClose={() => setAdding(false)} />}
    </section>
  )
}
