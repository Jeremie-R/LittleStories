import { useState, type CSSProperties } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { hasLocalData } from '../data/localBackend'
import { useData } from '../data/store'
import { initials } from '../lib/journal'
import { useToast } from './Feedback'
import { Icon } from './Icon'

/** Your own name: what you wrote on You, else your Google name. */
export function useMyName(): string {
  const { state } = useAuth()
  const data = useData()
  return data?.profile.name?.trim() || (state.status === 'signedIn' ? state.user.name : '')
}

export function MeAvatar({ size = 44 }: { size?: number }) {
  const { state } = useAuth()
  const name = useMyName()
  const photo = state.status === 'signedIn' ? state.user.photoURL : null
  return (
    <span className="avatar avatar--me" style={{ '--size': `${size}px` } as CSSProperties} aria-hidden="true">
      {photo ? <img src={photo} alt="" referrerPolicy="no-referrer" /> : name ? <span className="avatar__initials">{initials(name)}</span> : <Icon name="user" />}
    </span>
  )
}

/** After signing in, offers to move what was written without an account into it. */
export function ImportBanner() {
  const { state, importDeviceData } = useAuth()
  const toast = useToast()
  const [visible, setVisible] = useState(() => state.status === 'signedIn' && hasLocalData())
  const [busy, setBusy] = useState(false)
  if (!visible || state.status !== 'signedIn') return null

  const move = async () => {
    setBusy(true)
    try {
      const count = await importDeviceData()
      toast(`Moved ${count} ${count === 1 ? 'entry' : 'entries'} into your account`)
      setVisible(false)
    } catch (error) {
      console.error(error)
      toast("Couldn't move them. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="banner">
      <span className="banner__icon">
        <Icon name="device" />
      </span>
      <div className="banner__body">
        <p className="banner__title">Stories on this device</p>
        <p className="banner__text">You wrote some before signing in. Move them into your account to keep them safe.</p>
        <div className="banner__actions">
          <button className="btn btn--primary btn--sm" onClick={move} disabled={busy}>
            {busy ? 'Moving…' : 'Move them'}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => setVisible(false)}>
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
