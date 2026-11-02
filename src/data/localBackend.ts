import { normalizeData, type Data } from '../lib/types'
import type { Backend } from './backend'

const KEY = 'ls:data:v1'
export const DEVICE_SCOPE = 'device'

export function readLocalData(): Data {
  try {
    const raw = localStorage.getItem(KEY)
    return normalizeData(raw ? JSON.parse(raw) : {})
  } catch {
    return normalizeData({})
  }
}

export function clearLocalData() {
  localStorage.removeItem(KEY)
}

export const hasLocalData = () => {
  const data = readLocalData()
  return data.people.length > 0 || data.stories.length > 0
}

const upsert = <T extends { id: string }>(list: T[], item: T) => [...list.filter((x) => x.id !== item.id), item]

/** Keeps everything in this browser: text in localStorage, photos in IndexedDB. Used before (or without) signing in. */
export function createLocalBackend(): Backend {
  let data = readLocalData()
  const listeners = new Set<(data: Data) => void>()
  const emit = () => listeners.forEach((listener) => listener(data))

  const commit = (next: Partial<Data>) => {
    data = normalizeData({ ...data, ...next })
    emit()
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Save failed', error)
      window.dispatchEvent(new CustomEvent('ls:save-error'))
    }
  }

  // Another tab changed the data.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return
    data = readLocalData()
    emit()
  }

  return {
    kind: 'device',
    photoScope: DEVICE_SCOPE,
    subscribe(listener) {
      if (listeners.size === 0) window.addEventListener('storage', onStorage)
      listeners.add(listener)
      listener(data)
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) window.removeEventListener('storage', onStorage)
      }
    },
    putPerson: (person) => commit({ people: upsert(data.people, person) }),
    deletePerson: (id) => commit({ people: data.people.filter((p) => p.id !== id) }),
    putStory: (story) => commit({ stories: upsert(data.stories, story) }),
    deleteStory: (id) => commit({ stories: data.stories.filter((s) => s.id !== id) }),
    putProfile: (profile) => commit({ profile }),
    // Photos already live in IndexedDB; there's nowhere else to send them.
    uploadPhoto: () => {},
    deletePhoto: () => {},
    downloadPhoto: async () => null,
    pending: () => 0,
  }
}
