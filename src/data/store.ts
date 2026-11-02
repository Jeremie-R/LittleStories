import { useSyncExternalStore } from 'react'
import type { Data, Person, Profile, Story } from '../lib/types'
import type { Backend } from './backend'
import { removePhoto } from './photos'

let backend: Backend | null = null
let data: Data | null = null
let unsubscribe: (() => void) | null = null
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((listener) => listener())

export function setBackend(next: Backend | null) {
  if (next === backend) return
  unsubscribe?.()
  unsubscribe = null
  backend = next
  data = null
  emit()
  if (next) {
    unsubscribe = next.subscribe((fresh) => {
      data = fresh
      emit()
    })
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Current data, or null while the backend is still loading. */
export function useData(): Data | null {
  return useSyncExternalStore(subscribe, () => data)
}

export function useBackend(): Backend | null {
  return useSyncExternalStore(subscribe, () => backend)
}

export const pendingChanges = () => backend?.pending() ?? 0

const photosOf = (item: Person | Story | undefined): string[] =>
  !item ? [] : 'photos' in item ? item.photos : item.photo ? [item.photo] : []

/** Uploads photos that were added and deletes the ones that were removed. */
function syncPhotos(before: string[], after: string[]) {
  if (!backend) return
  for (const id of after) if (!before.includes(id)) backend.uploadPhoto(id)
  for (const id of before) if (!after.includes(id)) discardPhoto(id)
}

/** Deletes a photo everywhere. Also used for photos picked in an editor that was then cancelled. */
export function discardPhoto(id: string) {
  if (!backend) return
  backend.deletePhoto(id)
  removePhoto(backend.photoScope, id)
}

export function savePerson(person: Person) {
  if (!backend || !data) return
  const before = data.people.find((p) => p.id === person.id)
  backend.putPerson({ ...person, updatedAt: Date.now() })
  syncPhotos(photosOf(before), photosOf(person))
}

/**
 * Deletes someone, and the stories that were only theirs. Stories shared with
 * other people stay, without them.
 */
export function deletePerson(id: string) {
  if (!backend || !data) return
  const person = data.people.find((p) => p.id === id)
  for (const story of data.stories) {
    if (!story.people.includes(id)) continue
    if (story.people.length === 1) deleteStory(story.id)
    else saveStory({ ...story, people: story.people.filter((p) => p !== id) })
  }
  backend.deletePerson(id)
  photosOf(person).forEach(discardPhoto)
}

export function saveStory(story: Story) {
  if (!backend || !data) return
  const before = data.stories.find((s) => s.id === story.id)
  backend.putStory({ ...story, updatedAt: Date.now() })
  syncPhotos(photosOf(before), photosOf(story))
}

export function deleteStory(id: string) {
  if (!backend || !data) return
  const story = data.stories.find((s) => s.id === id)
  backend.deleteStory(id)
  photosOf(story).forEach(discardPhoto)
}

export function saveProfile(profile: Profile) {
  backend?.putProfile({ ...profile, updatedAt: Date.now() })
}

/** Adds a journal kept on this device to the signed-in account. Photos must already be copied to its scope. */
export function importData(local: Data) {
  if (!backend || !data) return
  for (const person of local.people) {
    backend.putPerson(person)
    photosOf(person).forEach((id) => backend!.uploadPhoto(id))
  }
  for (const story of local.stories) {
    backend.putStory(story)
    photosOf(story).forEach((id) => backend!.uploadPhoto(id))
  }
  const hasProfile = Object.keys(data.profile).some((k) => k !== 'updatedAt')
  if (!hasProfile && Object.keys(local.profile).length) backend.putProfile(local.profile)
}

export const allPhotoIds = (d: Data) => [...d.people.flatMap(photosOf), ...d.stories.flatMap(photosOf)]
