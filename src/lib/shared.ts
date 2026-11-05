import type { SharedThing } from './types'

export type LinkPreview = Pick<SharedThing, 'url' | 'title' | 'image' | 'icon' | 'site'>

/** Finds the web address in what was pasted: share sheets often add words around it. */
export function findLink(text: string): string | null {
  const raw = text.match(/https?:\/\/\S+/i)?.[0] ?? text.trim()
  if (!raw || /\s/.test(raw)) return null
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    return url.hostname.includes('.') ? url.href : null
  } catch {
    return null
  }
}

export function youtubeId(address: string): string | null {
  const url = new URL(address)
  const host = url.hostname.replace(/^(www|m|music)\./, '')
  if (host === 'youtu.be') return url.pathname.slice(1) || null
  if (host !== 'youtube.com') return null
  return url.searchParams.get('v') ?? url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]+)/)?.[1] ?? null
}

/** Songs and videos get a play mark on their picture. */
export const isPlayable = (address: string) => /(^|\.)(youtube\.com|youtu\.be|spotify\.com|soundcloud\.com|vimeo\.com)$/.test(new URL(address).hostname)

/** What's known without asking the server, for when it can't be reached or the site refuses. */
function basicPreview(url: string): LinkPreview {
  const site = new URL(url).hostname.replace(/^www\./, '')
  const id = youtubeId(url)
  return { url, title: site, site, image: id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined }
}

export async function fetchPreview(url: string): Promise<LinkPreview> {
  const basic = basicPreview(url)
  try {
    const response = await fetch('/api/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
    if (!response.ok) return basic
    const found = (await response.json()) as Partial<LinkPreview>
    return { ...basic, title: found.title || basic.title, site: found.site || basic.site, image: found.image ?? basic.image, icon: found.icon }
  } catch {
    return basic
  }
}
