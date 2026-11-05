import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { ImportBanner, MeAvatar, useMyName } from '../components/Account'
import { Avatar } from '../components/Avatar'
import { DateField } from '../components/DateField'
import { useConfirm } from '../components/Feedback'
import { HeartMeter } from '../components/HeartMeter'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { pendingChanges, saveProfile, useData } from '../data/store'
import { ageOn, dayKey, formatDuration } from '../lib/dates'
import { useAutosize } from '../lib/hooks'
import { computeStats } from '../lib/journal'
import type { Data, Profile } from '../lib/types'

function download(data: Data) {
  const blob = new Blob([JSON.stringify({ app: 'Little Stories', version: __APP_VERSION__, exportedAt: new Date().toISOString(), ...data }, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `little-stories-${dayKey()}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function You() {
  const data = useData()!
  const { state, cloudEnabled, signOut } = useAuth()
  const confirm = useConfirm()
  const name = useMyName()
  const stats = useMemo(() => computeStats(data), [data])
  const [editing, setEditing] = useState(false)
  const { profile } = data

  const leave = async () => {
    if (state.status === 'signedIn') {
      const pending = pendingChanges()
      const ok = await confirm(
        pending
          ? {
              title: 'Sign out now?',
              message: `${pending} ${pending === 1 ? 'change hasn’t' : 'changes haven’t'} reached your account yet and would be lost. Connect to the internet first to keep ${pending === 1 ? 'it' : 'them'}.`,
              confirmLabel: 'Sign out anyway',
              danger: true,
            }
          : { title: 'Sign out?', message: 'Your journal stays safe in your account. Its copy on this device is removed.', confirmLabel: 'Sign out' },
      )
      if (ok) await signOut()
    } else {
      const ok = await confirm({ title: 'Back to the welcome screen?', message: 'Your journal stays on this device and will be here when you come back.', confirmLabel: 'Continue' })
      if (ok) await signOut()
    }
  }

  const years = stats.storiesPerYear.slice(-6)
  const busiest = Math.max(1, ...years.map((y) => y.count))

  return (
    <main className="page">
      <header className="screen-head">
        <h1 className="title title--xl">You</h1>
      </header>

      <section className="me-card">
        <div className="me-card__top">
          <MeAvatar size={72} />
          <div className="me-card__who">
            <h2 className="me-card__name">{name || 'You'}</h2>
            {profile.birthday && <p className="me-card__details">{ageOn(profile.birthday)} years old</p>}
          </div>
          <button className="icon-btn" onClick={() => setEditing(true)} aria-label="Edit about you">
            <Icon name="pencil" />
          </button>
        </div>
        {profile.about ? (
          <p className="me-card__about">{profile.about}</p>
        ) : (
          <button className="me-card__prompt" onClick={() => setEditing(true)}>
            Write a few words about yourself: who you are now, what you’re looking for, what you’ve learned.
          </button>
        )}
      </section>

      <ImportBanner />

      <h2 className="section-title">Your little stories</h2>
      <div className="tiles">
        <Link to="/" className="tile tile--sun">
          <b>{stats.people}</b>
          <span>{stats.people === 1 ? 'heart' : 'hearts'}</span>
        </Link>
        <Link to="/stories" className="tile tile--lilac">
          <b>{stats.stories}</b>
          <span>{stats.stories === 1 ? 'story' : 'stories'}</span>
        </Link>
        <Link to="/map" className="tile tile--sage">
          <b>{stats.countries}</b>
          <span>{stats.countries === 1 ? 'country' : 'countries'}</span>
        </Link>
        <div className="tile tile--blush">
          <b>{stats.photos}</b>
          <span>{stats.photos === 1 ? 'photo' : 'photos'}</span>
        </div>
      </div>

      {stats.topTags.length > 0 && (
        <section className="chart-card">
          <h3 className="chart-card__title">Your words</h3>
          <p className="chart-card__sub">The words you use most, for people and stories</p>
          <div className="pill-bars">
            {stats.topTags.map((t, i) => (
              <div key={t.tag} className="pill-bar">
                <div className="pill-bar__track">
                  <div className={`pill-bar__fill tone-${i}`} style={{ '--h': `${Math.max(18, t.share * 100)}%` } as CSSProperties}>
                    <span>{Math.round(t.share * 100)}%</span>
                  </div>
                </div>
                <span className="pill-bar__label">{t.tag}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {years.length > 0 && (
        <section className="chart-card">
          <h3 className="chart-card__title">Stories per year</h3>
          <div className="year-bars">
            {years.map((y) => (
              <div key={y.year} className={`year-bar ${y.count === busiest ? 'year-bar--top' : ''}`}>
                <span className="year-bar__count">{y.count}</span>
                <span className="year-bar__bar" style={{ '--h': `${(y.count / busiest) * 100}%` } as CSSProperties} />
                <span className="year-bar__label">{y.year}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {(stats.averageRating || stats.longest || stats.mostStories) && (
        <div className="highlights">
          {stats.averageRating && (
            <div className="highlight">
              <HeartMeter value={stats.averageRating} size={40} />
              <span>
                <b>{stats.averageRating.toFixed(1)}</b>
                <small>average heart</small>
              </span>
            </div>
          )}
          {stats.longest && (
            <Link to={`/people/${stats.longest.person.id}`} className="highlight">
              <Avatar person={stats.longest.person} size={40} />
              <span>
                <b>{formatDuration(stats.longest.days)}</b>
                <small>longest, with {stats.longest.person.name.split(' ')[0]}</small>
              </span>
            </Link>
          )}
          {stats.mostStories && (
            <Link to={`/people/${stats.mostStories.person.id}`} className="highlight">
              <Avatar person={stats.mostStories.person} size={40} />
              <span>
                <b>
                  {stats.mostStories.count} {stats.mostStories.count === 1 ? 'story' : 'stories'}
                </b>
                <small>most shared, with {stats.mostStories.person.name.split(' ')[0]}</small>
              </span>
            </Link>
          )}
        </div>
      )}

      <h2 className="section-title">Account</h2>
      <section className="group">
        {state.status === 'signedIn' ? (
          <div className="row">
            <span className="row__icon">
              <Icon name="cloud" />
            </span>
            <span className="row__body">
              <b>Saved in your account</b>
              <small>{state.user.email}</small>
            </span>
          </div>
        ) : (
          <div className="row">
            <span className="row__icon">
              <Icon name="device" />
            </span>
            <span className="row__body">
              <b>Kept on this device only</b>
              <small>{cloudEnabled ? 'Sign in to back it up and use it on your other devices.' : 'Clearing this browser’s data would erase it.'}</small>
            </span>
            {cloudEnabled && (
              <Link to="/sign-in" className="btn btn--primary btn--sm">
                Sign in
              </Link>
            )}
          </div>
        )}
        <button className="row row--button" onClick={() => download(data)}>
          <span className="row__icon">
            <Icon name="download" />
          </span>
          <span className="row__body">
            <b>Download my journal</b>
            <small>Everything you wrote, as a JSON file (without photos)</small>
          </span>
        </button>
        <button className="row row--button" onClick={leave}>
          <span className="row__icon">
            <Icon name="logout" />
          </span>
          <span className="row__body">
            <b>{state.status === 'signedIn' ? 'Sign out' : 'Leave'}</b>
          </span>
        </button>
      </section>

      <p className="fineprint">Little Stories {__APP_VERSION__}</p>

      {editing && <ProfileSheet profile={profile} onClose={() => setEditing(false)} />}
    </main>
  )
}

function ProfileSheet({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [draft, setDraft] = useState<Profile>(profile)
  const about = useAutosize(draft.about ?? '')
  const set = (patch: Partial<Profile>) => setDraft((d) => ({ ...d, ...patch }))

  const save = () => {
    saveProfile({ ...draft, name: draft.name?.trim() || undefined, about: draft.about?.trim() || undefined })
    onClose()
  }

  return (
    <Sheet
      open
      title="About you"
      onClose={onClose}
      footer={
        <button className="btn btn--primary btn--block btn--lg" onClick={save}>
          Save
        </button>
      }
    >
      <div className="sheet-form">
        <input className="input" placeholder="Your name" aria-label="Your name" value={draft.name ?? ''} onChange={(e) => set({ name: e.target.value })} />
        <div className="form-card form-card--flat">
          <DateField label="Birthday" value={draft.birthday} onChange={(birthday) => set({ birthday })} placeholder="Add" clearable />
        </div>
        <textarea
          ref={about}
          className="textarea"
          rows={4}
          placeholder="Who you are now, what you’re looking for, what you’ve learned…"
          aria-label="About you"
          value={draft.about ?? ''}
          onChange={(e) => set({ about: e.target.value })}
        />
      </div>
    </Sheet>
  )
}
