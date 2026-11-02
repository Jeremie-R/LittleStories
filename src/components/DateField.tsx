import { formatDayShort } from '../lib/dates'
import { Icon } from './Icon'

/** A labelled native date picker. Shows a friendly placeholder while empty (iOS shows a blank box otherwise). */
export function DateField({ label, value, onChange, placeholder = 'Choose a day', clearable = false }: { label: string; value?: string; onChange: (day: string | undefined) => void; placeholder?: string; clearable?: boolean }) {
  return (
    <div className="date-field">
      <span className="date-field__label">{label}</span>
      <span className={`date-field__value ${value ? '' : 'date-field__value--empty'}`}>{value ? formatDayShort(value) : placeholder}</span>
      <input
        type="date"
        className="date-field__input"
        aria-label={label}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker?.()
          } catch {
            // Not allowed here (or already open): the native control still works.
          }
        }}
      />
      {clearable && value ? (
        <button type="button" className="date-field__clear" onClick={() => onChange(undefined)} aria-label={`Clear ${label.toLowerCase()}`}>
          <Icon name="x" size={16} strokeWidth={2.4} />
        </button>
      ) : (
        <span className="date-field__icon">
          <Icon name="calendar" size={18} />
        </span>
      )}
    </div>
  )
}
