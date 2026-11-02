import type { Data } from './types'

/** Offered while you haven't used many tags yet, so there's always something to tap. */
export const SUGGESTED_TAGS = [
  'fun',
  'comfy',
  'sweet',
  'funny',
  'kind',
  'romantic',
  'adventurous',
  'passionate',
  'calm',
  'chaotic',
  'clever',
  'friend',
  'first date',
  'travel',
  'summer',
  'long distance',
]

const key = (tag: string) => tag.trim().toLocaleLowerCase()

/** Every tag used on people and stories, most used first. */
export function usedTags(data: Data): string[] {
  const counts = new Map<string, { tag: string; count: number }>()
  for (const item of [...data.people, ...data.stories]) {
    for (const tag of item.tags) {
      const entry = counts.get(key(tag))
      if (entry) entry.count++
      else counts.set(key(tag), { tag, count: 1 })
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag)).map((e) => e.tag)
}

/**
 * Adds a tag unless it's already there (ignoring case). Reuses the spelling of a tag
 * you've used before, so "Comfy" and "comfy" don't become two tags.
 */
export function addTag(tags: string[], raw: string, known: string[]): string[] {
  const tag = raw.trim().replace(/\s+/g, ' ')
  if (!tag || tags.some((t) => key(t) === key(tag))) return tags
  return [...tags, known.find((t) => key(t) === key(tag)) ?? tag]
}

export const sameTag = (a: string, b: string) => key(a) === key(b)
