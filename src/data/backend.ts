import type { Data, Person, Profile, Story } from '../lib/types'

/**
 * Where the journal lives. Screens only talk to data/store.ts, which talks to this
 * interface, so device-only storage and the signed-in cloud storage are interchangeable.
 *
 * Writes are synchronous: a backend updates its copy and calls its listeners straight
 * away, then persists in the background (a cloud backend queues the change until it's online).
 */
export interface Backend {
  kind: 'device' | 'cloud'
  /** Prefix for this backend's photos in IndexedDB, so accounts on a shared device stay apart. */
  photoScope: string
  /** Calls `listener` with the full data set once ready, then after every change. */
  subscribe(listener: (data: Data) => void): () => void
  putPerson(person: Person): void
  deletePerson(id: string): void
  putStory(story: Story): void
  deleteStory(id: string): void
  putProfile(profile: Profile): void
  /** Sends a photo already saved in IndexedDB to the cloud. */
  uploadPhoto(id: string): void
  deletePhoto(id: string): void
  /** Fetches a photo this device doesn't have yet (added on another device). */
  downloadPhoto(id: string): Promise<Blob | null>
  /** Changes not yet saved to the cloud. */
  pending(): number
}
