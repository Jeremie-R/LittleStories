import { ageOn, daysBetween, monthKey } from './dates'
import type { Data, Person, Story } from './types'

/** Number of accent colours (`.accent-0` … in components.css). */
export const ACCENTS = 8

/** A stable accent colour per person, so their avatar and timeline dots always match. */
export function accentOf(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return Math.abs(hash) % ACCENTS
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase()
}

/** "27 when you met (30 today)", or "30 years old" without a first date. */
export function ageLine({ born, start }: Pick<Person, 'born' | 'start'>): string {
  if (!born) return ''
  const today = ageOn(born)
  if (!start) return `${today} years old`
  const met = ageOn(born, start)
  return met === today ? `${met} when you met` : `${met} when you met (${today} today)`
}

export interface PersonGroup {
  label: string
  people: Person[]
}

/**
 * The Hearts list, most recent first: people still in your life ("Now"), then by the
 * year it ended (or started), then anyone without dates.
 */
export function groupPeople(people: Person[]): PersonGroup[] {
  const now: Person[] = []
  const undated: Person[] = []
  const years = new Map<string, Person[]>()
  for (const p of people) {
    const day = p.end ?? p.start
    if (p.start && !p.end) now.push(p)
    else if (!day) undated.push(p)
    else years.set(day.slice(0, 4), [...(years.get(day.slice(0, 4)) ?? []), p])
  }
  const byDay = (a: Person, b: Person) => (b.end ?? b.start ?? '').localeCompare(a.end ?? a.start ?? '') || b.createdAt - a.createdAt
  return [
    { label: 'Now', people: now.sort((a, b) => b.start!.localeCompare(a.start!)) },
    ...[...years.keys()].sort().reverse().map((year) => ({ label: year, people: years.get(year)!.sort(byDay) })),
    { label: 'No date', people: undated.sort((a, b) => b.createdAt - a.createdAt) },
  ].filter((g) => g.people.length > 0)
}

export const sortPeople = (people: Person[]) => groupPeople(people).flatMap((g) => g.people)

/** Newest first; same-day stories in the order they were written. */
export const sortStories = (stories: Story[]) =>
  [...stories].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)

export const storiesOf = (data: Data, personId: string) =>
  sortStories(data.stories.filter((s) => s.people.includes(personId)))

export function storyCounts(stories: Story[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const s of stories) for (const id of s.people) counts.set(id, (counts.get(id) ?? 0) + 1)
  return counts
}

/** Stories grouped by month (YYYY-MM), newest month first. */
export function byMonth(stories: Story[]): { month: string; stories: Story[] }[] {
  const groups: { month: string; stories: Story[] }[] = []
  for (const story of sortStories(stories)) {
    const month = monthKey(story.date)
    const last = groups[groups.length - 1]
    if (last?.month === month) last.stories.push(story)
    else groups.push({ month, stories: [story] })
  }
  return groups
}

export type MapMode = 'people' | 'stories'

/** How many people come from (or stories happened in) each country. */
export function countByCountry(data: Data, mode: MapMode): Map<string, number> {
  const counts = new Map<string, number>()
  const items = mode === 'people' ? data.people : data.stories
  for (const item of items) if (item.country) counts.set(item.country, (counts.get(item.country) ?? 0) + 1)
  return counts
}

export interface Stats {
  people: number
  stories: number
  photos: number
  countries: number
  averageRating: number | null
  /** Top tags with the share of people + stories that carry them. */
  topTags: { tag: string; share: number }[]
  /** Oldest first. */
  storiesPerYear: { year: string; count: number }[]
  longest: { person: Person; days: number } | null
  mostStories: { person: Person; count: number } | null
}

export function computeStats(data: Data): Stats {
  const countries = new Set([...data.people, ...data.stories].flatMap((x) => (x.country ? [x.country] : [])))
  const rated = data.people.filter((p) => p.rating)
  const photos = data.stories.reduce((n, s) => n + s.photos.length, 0) + data.people.filter((p) => p.photo).length

  const tagged = [...data.people, ...data.stories]
  const tagCounts = new Map<string, { tag: string; count: number }>()
  for (const item of tagged) {
    for (const tag of new Set(item.tags.map((t) => t.toLocaleLowerCase()))) {
      const entry = tagCounts.get(tag)
      if (entry) entry.count++
      else tagCounts.set(tag, { tag: item.tags.find((t) => t.toLocaleLowerCase() === tag)!, count: 1 })
    }
  }
  const topTags = [...tagCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map(({ tag, count }) => ({ tag, share: count / tagged.length }))

  const years = new Map<string, number>()
  for (const s of data.stories) years.set(s.date.slice(0, 4), (years.get(s.date.slice(0, 4)) ?? 0) + 1)
  const storiesPerYear = [...years].map(([year, count]) => ({ year, count })).sort((a, b) => a.year.localeCompare(b.year))

  let longest: Stats['longest'] = null
  for (const person of data.people) {
    if (!person.start) continue
    const days = daysBetween(person.start, person.end)
    if (!longest || days > longest.days) longest = { person, days }
  }

  const counts = storyCounts(data.stories)
  let mostStories: Stats['mostStories'] = null
  for (const person of data.people) {
    const count = counts.get(person.id) ?? 0
    if (count > 0 && (!mostStories || count > mostStories.count)) mostStories = { person, count }
  }

  return {
    people: data.people.length,
    stories: data.stories.length,
    photos,
    countries: countries.size,
    averageRating: rated.length ? rated.reduce((n, p) => n + p.rating!, 0) / rated.length : null,
    topTags,
    storiesPerYear,
    longest,
    mostStories,
  }
}
