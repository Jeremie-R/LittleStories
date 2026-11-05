import { useState } from 'react'
import { addTag, sameTag, SUGGESTED_TAGS } from '../lib/tags'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

const QUICK_TAGS = 8

/**
 * Free-text tags, called "words" in the app. Words you've used anywhere in the journal
 * are one tap away; Add opens a popup with everything, plus ideas and your own.
 */
export function TagInput({ value, onChange, known, label }: { value: string[]; onChange: (tags: string[]) => void; known: string[]; label: string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  const has = (tag: string) => value.some((t) => sameTag(t, tag))
  const add = (tag: string) => {
    onChange(addTag(value, tag, [...known, ...SUGGESTED_TAGS]))
    setText('')
  }
  const remove = (tag: string) => onChange(value.filter((t) => !sameTag(t, tag)))
  const close = () => {
    if (text.trim()) add(text)
    setOpen(false)
  }

  const query = text.trim().toLocaleLowerCase()
  const matches = (tag: string) => tag.toLocaleLowerCase().includes(query)
  const yours = [...value.filter((t) => !known.some((k) => sameTag(k, t))), ...known].filter(matches)
  const ideas = SUGGESTED_TAGS.filter((s) => !yours.some((t) => sameTag(t, s)) && !known.some((k) => sameTag(k, s))).filter(matches)
  const isNew = !!query && ![...known, ...SUGGESTED_TAGS, ...value].some((t) => sameTag(t, text))
  const quick = known.filter((tag) => !has(tag)).slice(0, QUICK_TAGS)

  const choice = (tag: string) => (
    <button key={tag} type="button" className={`chip ${has(tag) ? 'chip--on' : 'chip--suggest'}`} aria-pressed={has(tag)} onClick={() => (has(tag) ? remove(tag) : add(tag))}>
      {has(tag) && <Icon name="check" size={14} strokeWidth={2.6} />}
      {tag}
    </button>
  )

  return (
    <div>
      <div className="chip-row chip-row--wrap">
        {value.map((tag) => (
          <button key={tag} type="button" className="chip chip--on" onClick={() => remove(tag)} aria-label={`Remove ${tag}`}>
            {tag}
            <Icon name="x" size={14} strokeWidth={2.4} />
          </button>
        ))}
        <button type="button" className="chip chip--add" onClick={() => setOpen(true)}>
          <Icon name="plus" size={14} strokeWidth={2.4} />
          Add a word
        </button>
      </div>

      {quick.length > 0 && (
        <div className="chip-row chip-row--wrap tag-quick">
          {quick.map((tag) => (
            <button key={tag} type="button" className="chip chip--suggest" onClick={() => add(tag)}>
              <Icon name="plus" size={14} strokeWidth={2.4} />
              {tag}
            </button>
          ))}
        </div>
      )}

      <Sheet
        open={open}
        title={label}
        onClose={close}
        footer={
          <button type="button" className="btn btn--primary btn--block" onClick={close}>
            Done
          </button>
        }
      >
        <div className="tag-sheet">
          <label className="search">
            <Icon name="pencil" size={18} />
            <input
              value={text}
              placeholder="Your own word, or pick below"
              aria-label="Add your own word"
              enterKeyHint="done"
              autoCapitalize="none"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (text.trim()) add(text)
                }
              }}
            />
          </label>
          {isNew && (
            <button type="button" className="chip chip--add tag-sheet__new" onClick={() => add(text)}>
              <Icon name="plus" size={14} strokeWidth={2.4} />
              Add “{text.trim()}”
            </button>
          )}
          {yours.length > 0 && (
            <>
              <h3 className="section-title">Your words</h3>
              <div className="chip-row chip-row--wrap">{yours.map(choice)}</div>
            </>
          )}
          {ideas.length > 0 && (
            <>
              <h3 className="section-title">Ideas</h3>
              <div className="chip-row chip-row--wrap">{ideas.map(choice)}</div>
            </>
          )}
        </div>
      </Sheet>
    </div>
  )
}
