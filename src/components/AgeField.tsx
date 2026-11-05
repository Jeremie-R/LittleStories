import { ageOn, dayKey } from '../lib/dates'
import { ageLine } from '../lib/journal'
import { DateField } from './DateField'
import { Segmented } from './Segmented'

export interface AgeDraft {
  mode: 'age' | 'birthday'
  /** As typed: their age when you met (or today, without a date). */
  age: string
  birthday?: string
}

export function ageDraft(born: string | undefined, met: string | undefined): AgeDraft {
  const birthday = born && born.length > 4 ? born : undefined
  return { mode: birthday ? 'birthday' : 'age', age: born ? String(ageOn(born, met)) : '', birthday }
}

/** What gets saved: the birthday, or the birth year worked out from the age. */
export function bornFrom(draft: AgeDraft, met: string | undefined): string | undefined {
  if (draft.mode === 'birthday') return draft.birthday
  const age = Number(draft.age)
  if (!age) return undefined
  return String(Number((met ?? dayKey()).slice(0, 4)) - age)
}

/** How old they were when you met. A rough age is enough; an exact birthday is optional. */
export function AgeField({ value, onChange, met }: { value: AgeDraft; onChange: (value: AgeDraft) => void; met?: string }) {
  const born = bornFrom(value, met)

  const switchTo = (mode: AgeDraft['mode']) => {
    const age = mode === 'age' && !value.age && value.birthday ? String(ageOn(value.birthday, met)) : value.age
    onChange({ ...value, mode, age })
  }

  return (
    <>
      <Segmented<AgeDraft['mode']>
        label="Age"
        size="sm"
        value={value.mode}
        onChange={switchTo}
        options={[
          { value: 'age', label: 'Their age' },
          { value: 'birthday', label: 'Birthday' },
        ]}
      />
      {value.mode === 'age' ? (
        <label className="date-field">
          <span className="date-field__label">{met ? 'When you met' : 'Age today'}</span>
          <input
            className="age-input"
            inputMode="numeric"
            maxLength={2}
            placeholder="Age"
            value={value.age}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onChange({ ...value, age: e.target.value.replace(/\D/g, '') })}
          />
        </label>
      ) : (
        <DateField label="Birthday" value={value.birthday} onChange={(birthday) => onChange({ ...value, birthday })} clearable />
      )}
      {born && (
        <p className="field-hint">
          {value.mode === 'birthday' ? ageLine({ born, start: met }) : `Born around ${born}${met ? ` · ${ageOn(born)} today` : ''}`}
        </p>
      )}
    </>
  )
}
