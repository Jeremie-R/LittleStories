/** Someone you've shared part of your life with. The app calls them "hearts". */
export interface Person {
  id: string
  name: string
  /** Photo id (see data/photos.ts). */
  photo?: string
  /**
   * When you were together, as YYYY-MM-DD. The same start and end is a single day;
   * a start with no end is still going.
   */
  start?: string
  end?: string
  about?: string
  /** "YYYY-MM-DD", or just "YYYY" when you only know roughly how old they were. */
  born?: string
  /** ISO 3166-1 alpha-2 country code, e.g. "FR". */
  country?: string
  /** 1–10, shown as one heart filled to that level. */
  rating?: number
  tags: string[]
  /** Handle without the @. */
  instagram?: string
  /** Profile links. */
  facebook?: string
  linkedin?: string
  phone?: string
  createdAt: number
  updatedAt: number
}

/** A moment you want to remember. Shared by any number of people (or none). */
export interface Story {
  id: string
  title?: string
  text: string
  /** YYYY-MM-DD */
  date: string
  country?: string
  tags: string[]
  /** Person ids. */
  people: string[]
  /** Photo ids, in display order. */
  photos: string[]
  createdAt: number
  updatedAt: number
}

/** What you write about yourself on the You tab. */
export interface Profile {
  name?: string
  birthday?: string
  about?: string
  updatedAt?: number
}

export interface Data {
  people: Person[]
  stories: Story[]
  profile: Profile
}

const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [])

/** Fills in anything missing, so screens can rely on the shape whatever the storage returned. */
export function normalizeData(raw: Partial<Data> | null | undefined): Data {
  const now = Date.now()
  return {
    people: (raw?.people ?? []).map((p) => ({
      ...p,
      name: p.name ?? '',
      tags: strings(p.tags),
      createdAt: p.createdAt ?? now,
      updatedAt: p.updatedAt ?? now,
    })),
    stories: (raw?.stories ?? []).map((s) => ({
      ...s,
      text: s.text ?? '',
      tags: strings(s.tags),
      people: strings(s.people),
      photos: strings(s.photos),
      createdAt: s.createdAt ?? now,
      updatedAt: s.updatedAt ?? now,
    })),
    profile: raw?.profile ?? {},
  }
}

export const newId = () => crypto.randomUUID()
