// Sign-in and cloud storage. Only loaded (dynamic import) when the Supabase env vars
// are set, so device-only mode never downloads the Supabase client.
import { createClient, type User } from '@supabase/supabase-js'
import { normalizeData, type Data, type Person, type Profile, type Story } from '../lib/types'
import type { Backend } from './backend'
import { GOOGLE_CLIENT_ID, supabaseConfig } from './config'
import { clearPhotos, readPhoto } from './photos'

const supabase = createClient(supabaseConfig!.url, supabaseConfig!.key, {
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export interface AccountUser {
  uid: string
  name: string
  email: string
  photoURL: string | null
}

const toAccount = (user: User): AccountUser => ({
  uid: user.id,
  name: (user.user_metadata.full_name ?? user.user_metadata.name ?? '') as string,
  email: user.email ?? '',
  photoURL: (user.user_metadata.avatar_url ?? user.user_metadata.picture ?? null) as string | null,
})

export function watchUser(callback: (user: AccountUser | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session?.user ? toAccount(session.user) : null))
  return () => data.subscription.unsubscribe()
}

const GOOGLE_NONCE_KEY = 'ls:google-nonce'

/**
 * Leaves for Google's sign-in page. Google comes straight back to this site with a signed token,
 * rather than going through Supabase, so its screen names our domain and not <project>.supabase.co.
 * The nonce ties the token to this browser: Google gets its hash, Supabase checks it against the original.
 */
export async function signInWithGoogle() {
  const nonce = crypto.randomUUID()
  localStorage.setItem(GOOGLE_NONCE_KEY, nonce)
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce))
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.search = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: location.origin + '/',
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce: [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join(''),
    prompt: 'select_account',
  }).toString()
  location.assign(url.href)
}

/** On the way back from Google: turns its token into a session. Does nothing on any other page load. */
export async function finishGoogleSignIn() {
  const params = new URLSearchParams(location.hash.slice(1))
  const token = params.get('id_token')
  if (!token && !params.has('error')) return
  history.replaceState(null, '', location.pathname)
  const nonce = localStorage.getItem(GOOGLE_NONCE_KEY)
  localStorage.removeItem(GOOGLE_NONCE_KEY)
  // Closing Google's page without choosing an account isn't a failure.
  if (params.get('error') === 'access_denied') return
  if (!token || !nonce) throw new Error('Google sign-in could not be completed')
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token, nonce })
  if (error) throw error
}

/** Emails a one-time code. Creates the account on first use. */
export async function sendEmailCode(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
  if (error) throw error
}

export async function verifyEmailCode(email: string, code: string) {
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
  if (error) throw error
}

/** Signs out on this device only, and removes the journal's copy from it. */
export async function signOut(uid: string) {
  await supabase.auth.signOut({ scope: 'local' })
  localStorage.removeItem(cacheKey(uid))
  localStorage.removeItem(outboxKey(uid))
  await clearPhotos(photoScope(uid))
}

// ---------- Storage ----------

type Table = 'people' | 'stories'

/** A change waiting to be saved. Kept in localStorage so it survives closing the app offline. */
type Change =
  | { type: 'put'; table: Table; id: string; data: Person | Story }
  | { type: 'delete'; table: Table; id: string }
  | { type: 'profile'; data: Profile }
  | { type: 'upload'; id: string }
  | { type: 'unlink'; id: string }

const cacheKey = (uid: string) => `ls:cloud:${uid}`
const outboxKey = (uid: string) => `ls:outbox:${uid}`
export const photoScope = (uid: string) => `cloud:${uid}`

const BUCKET = 'photos'
const PAGE = 1000
const MAX_ATTEMPTS = 5

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function applyChange(data: Data, change: Change): Data {
  switch (change.type) {
    case 'put': {
      const list = data[change.table] as (Person | Story)[]
      return { ...data, [change.table]: [...list.filter((x) => x.id !== change.id), change.data] }
    }
    case 'delete': {
      const list = data[change.table] as (Person | Story)[]
      return { ...data, [change.table]: list.filter((x) => x.id !== change.id) }
    }
    case 'profile':
      return { ...data, profile: change.data }
    default:
      return data
  }
}

/** Two changes to the same thing: only the last one needs saving. */
const supersedes = (next: Change, old: Change) =>
  (next.type === 'put' || next.type === 'delete') && (old.type === 'put' || old.type === 'delete')
    ? next.table === old.table && next.id === old.id
    : next.type === 'profile' && old.type === 'profile'

/**
 * The signed-in journal: tables people, stories and profiles (see supabase/schema.sql),
 * photos in the private "photos" bucket under the user's id.
 *
 * Works offline: the last copy is cached in localStorage and shown straight away, and
 * changes wait in an outbox until they've been saved. Coming back to the app reloads
 * from the server, so edits from other devices show up.
 */
export function createCloudBackend(uid: string): Backend {
  const scope = photoScope(uid)
  let data: Data | null = readJson<Data>(cacheKey(uid))
  let outbox: Change[] = readJson<Change[]>(outboxKey(uid)) ?? []
  const attempts = new WeakMap<Change, number>()
  const listeners = new Set<(data: Data) => void>()
  let saved = 0
  let flushing = false
  let retry: number | undefined
  let stopped = false

  const emit = () => data && listeners.forEach((listener) => listener(data!))
  const persist = () => {
    try {
      if (data) localStorage.setItem(cacheKey(uid), JSON.stringify(data))
      localStorage.setItem(outboxKey(uid), JSON.stringify(outbox))
    } catch (error) {
      console.error('Could not cache the journal', error)
    }
  }

  async function fetchAll<T>(table: Table): Promise<T[]> {
    const rows: T[] = []
    for (let from = 0; ; from += PAGE) {
      const { data: page, error } = await supabase.from(table).select('data').order('id').range(from, from + PAGE - 1)
      if (error) throw error
      rows.push(...page.map((row) => row.data as T))
      if (page.length < PAGE) return rows
    }
  }

  async function refresh() {
    const savedBefore = saved
    try {
      const [people, stories, profile] = await Promise.all([
        fetchAll<Person>('people'),
        fetchAll<Story>('stories'),
        supabase.from('profiles').select('data').maybeSingle(),
      ])
      if (profile.error) throw profile.error
      if (stopped) return
      // A change was saved while we were loading, so this copy may predate it: load again.
      if (saved !== savedBefore) return refresh()
      data = outbox.reduce(applyChange, normalizeData({ people, stories, profile: (profile.data?.data as Profile) ?? {} }))
      persist()
      emit()
    } catch (error) {
      console.error('Could not load the journal', error)
      if (stopped || data) return
      // First launch and offline: start empty rather than wait forever. Changes are kept and merged later.
      data = outbox.reduce(applyChange, normalizeData({}))
      emit()
      window.dispatchEvent(new CustomEvent('ls:load-error'))
    }
  }

  async function save(change: Change) {
    const done = (result: { error: unknown }) => {
      if (result.error) throw result.error
    }
    switch (change.type) {
      case 'put':
        return done(await supabase.from(change.table).upsert({ user_id: uid, id: change.id, data: change.data, updated_at: new Date().toISOString() }))
      case 'delete':
        return done(await supabase.from(change.table).delete().eq('user_id', uid).eq('id', change.id))
      case 'profile':
        return done(await supabase.from('profiles').upsert({ user_id: uid, data: change.data, updated_at: new Date().toISOString() }))
      case 'upload': {
        // Gone already: it was removed before it could be uploaded.
        const blob = await readPhoto(scope, change.id).catch(() => undefined)
        if (!blob) return
        return done(await supabase.storage.from(BUCKET).upload(`${uid}/${change.id}`, blob, { contentType: blob.type, upsert: true }))
      }
      case 'unlink':
        return done(await supabase.storage.from(BUCKET).remove([`${uid}/${change.id}`]))
    }
  }

  async function flush() {
    if (flushing || stopped) return
    flushing = true
    window.clearTimeout(retry)
    try {
      while (outbox.length && !stopped) {
        const change = outbox[0]
        try {
          await save(change)
        } catch (error) {
          console.error('Save failed', error)
          const tries = (attempts.get(change) ?? 0) + 1
          attempts.set(change, tries)
          // Offline is expected; anything else that keeps failing is dropped so it can't block the rest.
          if (navigator.onLine && tries >= MAX_ATTEMPTS) {
            window.dispatchEvent(new CustomEvent('ls:save-error'))
          } else {
            retry = window.setTimeout(flush, Math.min(60_000, 2_000 * 2 ** tries))
            return
          }
        }
        outbox = outbox.filter((c) => c !== change)
        saved++
        persist()
      }
    } finally {
      flushing = false
    }
  }

  function queue(change: Change) {
    if (data) data = applyChange(data, change)
    // The change being saved right now stays; it's removed by identity when it's done.
    outbox = [...outbox.filter((old, i) => (i === 0 && flushing) || !supersedes(change, old)), change]
    persist()
    emit()
    flush()
  }

  const onOnline = () => {
    flush()
    refresh()
  }
  const onVisible = () => document.visibilityState === 'visible' && onOnline()

  return {
    kind: 'cloud',
    photoScope: scope,
    subscribe(listener) {
      listeners.add(listener)
      if (listeners.size === 1) {
        stopped = false
        window.addEventListener('online', onOnline)
        document.addEventListener('visibilitychange', onVisible)
        refresh()
        flush()
      }
      if (data) listener(data)
      return () => {
        listeners.delete(listener)
        if (listeners.size > 0) return
        stopped = true
        window.clearTimeout(retry)
        window.removeEventListener('online', onOnline)
        document.removeEventListener('visibilitychange', onVisible)
      }
    },
    putPerson: (person) => queue({ type: 'put', table: 'people', id: person.id, data: person }),
    deletePerson: (id) => queue({ type: 'delete', table: 'people', id }),
    putStory: (story) => queue({ type: 'put', table: 'stories', id: story.id, data: story }),
    deleteStory: (id) => queue({ type: 'delete', table: 'stories', id }),
    putProfile: (profile) => queue({ type: 'profile', data: profile }),
    uploadPhoto: (id) => queue({ type: 'upload', id }),
    deletePhoto: (id) => queue({ type: 'unlink', id }),
    async downloadPhoto(id) {
      const { data: blob, error } = await supabase.storage.from(BUCKET).download(`${uid}/${id}`)
      if (error) return null
      return blob
    },
    pending: () => outbox.length,
  }
}
