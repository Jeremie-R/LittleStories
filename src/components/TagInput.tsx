import { useState } from 'react'
import { addTag, sameTag, SUGGESTED_TAGS } from '../lib/tags'
import { Icon } from './Icon'

/**
 * Free-text tags. Tags you've used anywhere in the journal come first as suggestions,
 * then a few ideas for when you don't feel like typing.
 */
export function TagInput({ value, onChange, known, label }: { value: string[]; onChange: (tags: string[]) => void; known: string[]; label: string }) {
  const [text, setText] = useState('')

  const add = (tag: string) => {
    onChange(addTag(value, tag, known))
    setText('')
  }
  const remove = (tag: string) => onChange(value.filter((t) => t !== tag))

  const query = text.trim().toLocaleLowerCase()
  const pool = [...known, ...SUGGESTED_TAGS.filter((s) => !known.some((k) => sameTag(k, s)))].filter(
    (tag) => !value.some((t) => sameTag(t, tag)),
  )
  const suggestions = (query ? pool.filter((tag) => tag.toLocaleLowerCase().includes(query)) : pool).slice(0, 14)

  return (
    <div className="tag-input">
      <div className="tag-input__box">
        {value.map((tag) => (
          <button key={tag} type="button" className="chip chip--on" onClick={() => remove(tag)} aria-label={`Remove ${tag}`}>
            {tag}
            <Icon name="x" size={14} strokeWidth={2.4} />
          </button>
        ))}
        <input
          className="tag-input__field"
          value={text}
          aria-label={label}
          placeholder={value.length ? 'Add a tag' : 'Type a tag, or pick one below'}
          enterKeyHint="done"
          autoCapitalize="none"
          onChange={(e) => {
            const next = e.target.value
            if (/[,;]$/.test(next)) add(next.slice(0, -1))
            else setText(next)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add(text)
            } else if (e.key === 'Backspace' && !text && value.length) {
              remove(value[value.length - 1])
            }
          }}
          onBlur={() => text.trim() && add(text)}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="chip-row chip-row--scroll tag-input__suggestions">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              className="chip chip--suggest"
              // Keep focus in the field, so a half-typed tag isn't added on blur first.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(tag)}
            >
              <Icon name="plus" size={14} strokeWidth={2.4} />
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
