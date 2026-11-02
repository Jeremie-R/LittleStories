import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { CountryField } from '../components/CountryField'
import { DateField } from '../components/DateField'
import { useConfirm } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { PeopleField } from '../components/PeopleField'
import { PhotosEditor, usePhotoDrafts } from '../components/PhotoFields'
import { TagInput } from '../components/TagInput'
import { deleteStory, saveStory, useData } from '../data/store'
import { dayKey } from '../lib/dates'
import { useAutosize, useBack } from '../lib/hooks'
import { usedTags } from '../lib/tags'
import { newId, type Story } from '../lib/types'

export function StoryEditor() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const data = useData()!
  const navigate = useNavigate()
  const back = useBack(id ? `/stories/${id}` : '/stories')
  const confirm = useConfirm()
  const drafts = usePhotoDrafts()
  const existing = id ? data.stories.find((s) => s.id === id) : undefined

  const [draft, setDraft] = useState<Story>(() => {
    if (existing) return existing
    // Opened from someone's page: the story is with them.
    const withId = params.get('with')
    return {
      id: newId(),
      text: '',
      date: params.get('date') ?? dayKey(),
      tags: [],
      people: withId && data.people.some((p) => p.id === withId) ? [withId] : [],
      photos: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  })
  const text = useAutosize(draft.text)
  const known = useMemo(() => usedTags(data), [data])
  const countries = useMemo(() => [...data.stories, ...data.people].flatMap((x) => (x.country ? [x.country] : [])), [data])

  if (id && !existing) return <Navigate to="/stories" replace />

  const set = (patch: Partial<Story>) => setDraft((d) => ({ ...d, ...patch }))
  const canSave = !!(draft.text.trim() || draft.title?.trim() || draft.photos.length)

  const save = () => {
    const story: Story = { ...draft, title: draft.title?.trim() || undefined, text: draft.text.trim() }
    drafts.keep(story.photos)
    saveStory(story)
    if (existing) back()
    else navigate(`/stories/${story.id}`, { replace: true })
  }

  const remove = async () => {
    if (!existing) return
    const ok = await confirm({ title: 'Delete this story?', message: existing.photos.length ? 'Its photos will be deleted too.' : undefined, confirmLabel: 'Delete', danger: true })
    if (!ok) return
    deleteStory(existing.id)
    navigate('/stories', { replace: true })
  }

  return (
    <main className="page page--editor">
      <header className="topbar">
        <button className="icon-btn" onClick={back} aria-label="Cancel">
          <Icon name="x" />
        </button>
        <h1 className="topbar__title">{existing ? 'Edit story' : 'New story'}</h1>
        <span className="topbar__spacer" />
      </header>

      <section className="form-card">
        <DateField label="Day" value={draft.date} onChange={(date) => set({ date: date ?? dayKey() })} />
      </section>

      <section className="form-card form-card--writing">
        <input
          className="input input--story-title"
          placeholder="A title (optional)"
          aria-label="Title"
          value={draft.title ?? ''}
          onChange={(e) => set({ title: e.target.value })}
        />
        <textarea
          ref={text}
          className="textarea textarea--story"
          rows={6}
          placeholder="What happened? What do you want to remember?"
          aria-label="Story"
          value={draft.text}
          onChange={(e) => set({ text: e.target.value })}
          autoFocus={!existing}
        />
      </section>

      <section className="form-card">
        <h2 className="form-card__title">With</h2>
        <PeopleField people={data.people} value={draft.people} onChange={(people) => set({ people })} />
      </section>

      <section className="form-card">
        <h2 className="form-card__title">Photos</h2>
        <PhotosEditor value={draft.photos} update={(change) => setDraft((d) => ({ ...d, photos: change(d.photos) }))} drafts={drafts} />
      </section>

      <section className="form-card">
        <CountryField label="Where it happened" value={draft.country} onChange={(country) => set({ country })} used={countries} />
      </section>

      <section className="form-card">
        <h2 className="form-card__title">Tags</h2>
        <TagInput label="Tags" value={draft.tags} onChange={(tags) => set({ tags })} known={known} />
      </section>

      {existing && (
        <button className="btn btn--danger-ghost btn--block" onClick={remove}>
          <Icon name="trash" size={20} />
          Delete story
        </button>
      )}

      <div className="sticky-foot">
        <button className="btn btn--primary btn--lg btn--block" onClick={save} disabled={!canSave}>
          {existing ? 'Save' : 'Save story'}
        </button>
      </div>
    </main>
  )
}
