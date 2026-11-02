import { useMemo, useState } from 'react'
import { COUNTRIES, countryName, flag } from '../lib/countries'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

/** A form row that opens a searchable country list. Countries already in the journal are listed first. */
export function CountryField({ label, value, onChange, used }: { label: string; value?: string; onChange: (code: string | undefined) => void; used: string[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const close = () => {
    setOpen(false)
    setQuery('')
  }
  const pick = (code: string | undefined) => {
    onChange(code)
    close()
  }

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase()
    return q ? COUNTRIES.filter((c) => c.name.toLocaleLowerCase().includes(q) || c.code.toLocaleLowerCase() === q) : COUNTRIES
  }, [query])
  const recent = query ? [] : used.filter((code, i) => used.indexOf(code) === i).slice(0, 6)

  const row = (code: string) => (
    <button key={code} type="button" className="pick-row" aria-pressed={code === value} onClick={() => pick(code)}>
      <span className="pick-row__flag">{flag(code)}</span>
      <span className="pick-row__name">{countryName(code)}</span>
      {code === value && <Icon name="check" size={20} strokeWidth={2.4} />}
    </button>
  )

  return (
    <>
      <button type="button" className="field-row" onClick={() => setOpen(true)}>
        <span className="field-row__icon">{value ? <span className="field-row__flag">{flag(value)}</span> : <Icon name="pin" />}</span>
        <span className="field-row__label">{label}</span>
        <span className={`field-row__value ${value ? '' : 'field-row__value--empty'}`}>{value ? countryName(value) : 'Choose'}</span>
        <Icon name="chevron" size={18} />
      </button>
      <Sheet
        open={open}
        title={label}
        onClose={close}
        tall
        footer={
          value && (
            <button type="button" className="btn btn--secondary btn--block" onClick={() => pick(undefined)}>
              No country
            </button>
          )
        }
      >
        <label className="search">
          <Icon name="search" size={20} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search countries" aria-label="Search countries" />
        </label>
        {recent.length > 0 && (
          <>
            <h3 className="section-title">In your journal</h3>
            <div className="pick-list">{recent.map(row)}</div>
            <h3 className="section-title">All countries</h3>
          </>
        )}
        <div className="pick-list">{results.map((c) => row(c.code))}</div>
        {results.length === 0 && <p className="empty-note">No country matches “{query}”.</p>}
      </Sheet>
    </>
  )
}
