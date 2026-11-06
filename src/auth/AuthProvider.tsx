import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { cloudEnabled } from '../data/config'
import { clearLocalData, createLocalBackend, DEVICE_SCOPE, readLocalData } from '../data/localBackend'
import { clearPhotos, copyPhotos } from '../data/photos'
import { allPhotoIds, importData, setBackend } from '../data/store'

type CloudModule = typeof import('../data/supabase')
type AccountUser = import('../data/supabase').AccountUser

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  /** Using the app without an account: data stays in this browser. */
  | { status: 'device' }
  | { status: 'signedIn'; user: AccountUser }

interface AuthContextValue {
  state: AuthState
  cloudEnabled: boolean
  /** Coming back from Google didn't end in a session. */
  googleFailed: boolean
  signInWithGoogle: () => Promise<void>
  sendEmailCode: (email: string) => Promise<void>
  verifyEmailCode: (email: string, code: string) => Promise<void>
  continueWithoutAccount: () => void
  signOut: () => Promise<void>
  /** Moves the journal kept on this device into the signed-in account. Returns how many people and stories moved. */
  importDeviceData: () => Promise<number>
}

const DEVICE_KEY = 'ls:device-mode'
const deviceMode = () => localStorage.getItem(DEVICE_KEY) === '1'
const idleState = (): AuthState => (deviceMode() ? { status: 'device' } : { status: 'signedOut' })

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth outside AuthProvider')
  return value
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => (cloudEnabled ? { status: 'loading' } : idleState()))
  const [googleFailed, setGoogleFailed] = useState(false)
  const cloud = useRef<CloudModule | null>(null)

  useEffect(() => {
    if (!cloudEnabled) return
    let cancelled = false
    let unwatch = () => {}
    import('../data/supabase')
      .then(async (mod) => {
        if (cancelled) return
        cloud.current = mod
        // Before watching, so the welcome screen doesn't flash while Google's token is being checked.
        await mod.finishGoogleSignIn().catch((error) => {
          console.error('Google sign-in failed', error)
          setGoogleFailed(true)
        })
        if (cancelled) return
        unwatch = mod.watchUser((user) => setState(user ? { status: 'signedIn', user } : idleState()))
      })
      .catch((error) => {
        console.error('Could not load sign-in', error)
        setState(idleState())
      })
    return () => {
      cancelled = true
      unwatch()
    }
  }, [])

  // Point the data store at the storage that matches who's using the app.
  const uid = state.status === 'signedIn' ? state.user.uid : null
  useEffect(() => {
    if (state.status === 'device') setBackend(createLocalBackend())
    else if (uid && cloud.current) setBackend(cloud.current.createCloudBackend(uid))
    else setBackend(null)
  }, [state.status, uid])

  const requireCloud = () => {
    if (!cloud.current) throw new Error('Sign-in is not set up yet')
    return cloud.current
  }

  const signInWithGoogle = useCallback(() => requireCloud().signInWithGoogle(), [])
  const sendEmailCode = useCallback((email: string) => requireCloud().sendEmailCode(email), [])
  const verifyEmailCode = useCallback((email: string, code: string) => requireCloud().verifyEmailCode(email, code), [])

  const continueWithoutAccount = useCallback(() => {
    localStorage.setItem(DEVICE_KEY, '1')
    setState({ status: 'device' })
  }, [])

  const signOut = useCallback(async () => {
    localStorage.removeItem(DEVICE_KEY)
    if (cloud.current && uid) {
      setBackend(null)
      await cloud.current.signOut(uid)
    }
    setState({ status: 'signedOut' })
  }, [uid])

  const importDeviceData = useCallback(async () => {
    if (!cloud.current || !uid) return 0
    const local = readLocalData()
    const photos = allPhotoIds(local)
    await copyPhotos(DEVICE_SCOPE, cloud.current.photoScope(uid), photos)
    importData(local)
    clearLocalData()
    await clearPhotos(DEVICE_SCOPE)
    return local.people.length + local.stories.length
  }, [uid])

  return (
    <AuthContext.Provider
      value={{ state, cloudEnabled, googleFailed, signInWithGoogle, sendEmailCode, verifyEmailCode, continueWithoutAccount, signOut, importDeviceData }}
    >
      {children}
    </AuthContext.Provider>
  )
}
