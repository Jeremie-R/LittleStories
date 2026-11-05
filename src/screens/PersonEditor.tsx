import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { AgeField, ageDraft, bornFrom, type AgeDraft } from '../components/AgeField'
import { CountryField } from '../components/CountryField'
import { DateField } from '../components/DateField'
import { useConfirm } from '../components/Feedback'
import { HeartInput } from '../components/HeartMeter'
import { Icon } from '../components/Icon'
import { AvatarPicker, usePhotoDrafts } from '../components/PhotoFields'
import { Segmented } from '../components/Segmented'
import { TagInput } from '../components/TagInput'
import { deletePerson, savePerson, useData } from '../data/store'
import { useAutosize, useBack } from '../lib/hooks'
import { facebookLink, instagramHandle, linkedinLink } from '../lib/links'
import { usedTags } from '../lib/tags'
import { periodsOf } from '../lib/journal'
import { newId, type Period, type Person } from '../lib/types'

type When = 'while' | 'day'

/** In order and without empty ones. Dates entered the wrong way round are swapped rather than complained about. */
function tidyPeriods(periods: Period[], when: When): Period[] {
  const entered = when === 'day' ? [{ start: periods[0].start, end: periods[0].start }] : periods
  return entered
    .filter((p) => p.start || p.end)
    .map((p) => (p.start && p.end && p.end < p.start ? { start: p.end, end: p.start } : p))
    .sort((a, b) => (a.start ?? a.end ?? '').localeCompare(b.start ?? b.end ?? ''))
}

function tidy(draft: Person, when: When, entered: Period[], age: AgeDraft): Person {
  const periods = tidyPeriods(entered, when)
  const start = periods[0]?.start
  return {
    ...draft,
    name: draft.name.trim(),
    about: draft.about?.trim() || undefined,
    start,
    end: periods[periods.length - 1]?.end,
    periods: periods.length > 1 ? periods : undefined,
    born: bornFrom(age, start),
    instagram: instagramHandle(draft.instagram),
    facebook: facebookLink(draft.facebook),
    linkedin: linkedinLink(draft.linkedin),
    phone: draft.phone?.trim() || undefined,
  }
}

export function PersonEditor() {
  const { id } = useParams()
  const data = useData()!
  const navigate = useNavigate()
  const back = useBack(id ? `/people/${id}` : '/')
  const confirm = useConfirm()
  const drafts = usePhotoDrafts()
  const existing = id ? data.people.find((p) => p.id === id) : undefined

  const [draft, setDraft] = useState<Person>(() => existing ?? { id: newId(), name: '', tags: [], createdAt: Date.now(), updatedAt: Date.now() })
  const [when, setWhen] = useState<When>(existing?.start && existing.start === existing.end ? 'day' : 'while')
  const [periods, setPeriods] = useState<Period[]>(() => (existing ? periodsOf(existing) : [{}]))
  const [age, setAge] = useState<AgeDraft>(() => ageDraft(existing?.born, existing?.start))
  const about = useAutosize(draft.about ?? '')
  const known = useMemo(() => usedTags(data), [data])
  const countries = useMemo(() => [...data.people, ...data.stories].flatMap((x) => (x.country ? [x.country] : [])), [data])

  if (id && !existing) return <Navigate to="/" replace />

  const set = (patch: Partial<Person>) => setDraft((d) => ({ ...d, ...patch }))
  const setPeriod = (index: number, patch: Period) => setPeriods((all) => all.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  const last = periods[periods.length - 1]
  const firstMet = periods.flatMap((p) => (p.start ? [p.start] : [])).sort()[0]

  const save = () => {
    const person = tidy(draft, when, periods, age)
    drafts.keep(person.photo ? [person.photo] : [])
    savePerson(person)
    if (existing) back()
    else navigate(`/people/${person.id}`, { replace: true })
  }

  const remove = async () => {
    if (!existing) return
    const theirs = data.stories.filter((s) => s.people.includes(existing.id))
    const only = theirs.filter((s) => s.people.length === 1).length
    const ok = await confirm({
      title: `Delete ${existing.name || 'this person'}?`,
      message:
        only > 0
          ? `Their ${only === 1 ? 'story' : `${only} stories`} will be deleted too.${theirs.length > only ? ' Stories shared with others stay.' : ''}`
          : theirs.length > 0
            ? 'Stories shared with others stay, without them.'
            : undefined,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    deletePerson(existing.id)
    navigate('/', { replace: true })
  }

  return (
    <main className="page page--editor">
      <header className="topbar">
        <button className="icon-btn" onClick={back} aria-label="Cancel">
          <Icon name="x" />
        </button>
        <h1 className="topbar__title">{existing ? 'Edit' : 'New heart'}</h1>
        <span className="topbar__spacer" />
      </header>

      <AvatarPicker person={draft} onChange={(photo) => set({ photo })} drafts={drafts} />

      <input
        className="input input--title"
        placeholder="Their name"
        aria-label="Name"
        value={draft.name}
        onChange={(e) => set({ name: e.target.value })}
        autoFocus={!existing}
        autoComplete="off"
      />

      <section className="form-card">
        <h2 className="form-card__title">When</h2>
        {periods.length === 1 && (
          <Segmented<When>
            label="When"
            size="sm"
            value={when}
            onChange={setWhen}
            options={[
              { value: 'while', label: 'A while' },
              { value: 'day', label: 'One day' },
            ]}
          />
        )}
        {when === 'day' ? (
          <DateField label="Day" value={periods[0].start} onChange={(start) => setPeriod(0, { start })} clearable />
        ) : (
          periods.map((period, i) => (
            <div key={i} className="period">
              {i > 0 && (
                <div className="period__head">
                  <span>{i === 1 ? 'Then again' : 'And again'}</span>
                  <button type="button" className="text-btn" onClick={() => setPeriods((all) => all.filter((_, n) => n !== i))}>
                    Remove
                  </button>
                </div>
              )}
              <DateField label="From" value={period.start} onChange={(start) => setPeriod(i, { start })} clearable />
              <DateField label="Until" value={period.end} onChange={(end) => setPeriod(i, { end })} placeholder="Still going" clearable />
            </div>
          ))
        )}
        {when === 'while' && last.start && last.end && (
          <button type="button" className="chip chip--add period__add" onClick={() => setPeriods((all) => [...all, {}])}>
            <Icon name="plus" size={14} strokeWidth={2.4} />
            Add another time
          </button>
        )}
      </section>

      <section className="form-card">
        <h2 className="form-card__title">Age</h2>
        <AgeField value={age} onChange={setAge} met={firstMet} />
      </section>

      <section className="form-card">
        <CountryField label="Where they’re from" value={draft.country} onChange={(country) => set({ country })} used={countries} />
      </section>

      <section className="form-card">
        <h2 className="form-card__title">How much they mean to you</h2>
        <HeartInput value={draft.rating} onChange={(rating) => set({ rating })} />
      </section>

      <section className="form-card">
        <h2 className="form-card__title">In a few words</h2>
        <TagInput label="In a few words" value={draft.tags} onChange={(tags) => set({ tags })} known={known} />
      </section>

      <section className="form-card">
        <h2 className="form-card__title">About them</h2>
        <textarea
          ref={about}
          className="textarea"
          rows={3}
          placeholder="What were they like? How did you meet?"
          value={draft.about ?? ''}
          onChange={(e) => set({ about: e.target.value })}
        />
      </section>

      <section className="form-card">
        <h2 className="form-card__title">Keep in touch</h2>
        <label className="input-row">
          <Icon name="instagram" />
          <input placeholder="Instagram handle" value={draft.instagram ?? ''} onChange={(e) => set({ instagram: e.target.value })} autoCapitalize="none" autoComplete="off" />
        </label>
        <label className="input-row">
          <Icon name="facebook" />
          <input placeholder="Facebook profile link" value={draft.facebook ?? ''} onChange={(e) => set({ facebook: e.target.value })} inputMode="url" autoCapitalize="none" autoComplete="off" />
        </label>
        <label className="input-row">
          <Icon name="linkedin" />
          <input placeholder="LinkedIn profile link" value={draft.linkedin ?? ''} onChange={(e) => set({ linkedin: e.target.value })} inputMode="url" autoCapitalize="none" autoComplete="off" />
        </label>
        <label className="input-row">
          <Icon name="phone" />
          <input type="tel" placeholder="Phone number" value={draft.phone ?? ''} onChange={(e) => set({ phone: e.target.value })} autoComplete="off" />
        </label>
      </section>

      {existing && (
        <button className="btn btn--danger-ghost btn--block" onClick={remove}>
          <Icon name="trash" size={20} />
          Delete {existing.name || 'this person'}
        </button>
      )}

      <div className="sticky-foot">
        <button className="btn btn--primary btn--lg btn--block" onClick={save} disabled={!draft.name.trim()}>
          {existing ? 'Save' : 'Add to my hearts'}
        </button>
      </div>
    </main>
  )
}
