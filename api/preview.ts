// Finds a title and a picture for a pasted link. This has to run on the server: browsers can't read
// other sites. It fetches whatever URL it's given, so it refuses anything that isn't a public website,
// checks every redirect again, and only ever returns those few details, never the page itself.
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const TIMEOUT = 5_000
const MAX_BYTES = 500_000
const MAX_REDIRECTS = 4
const MAX_URL = 2_000
const USER_AGENT = 'LittleStoriesBot/1.0 (+https://littlestories.app.roberrini.com)'

// These give a clean title and cover without an account. Their pages are often consent walls or scripts.
const OEMBED = [
  { hosts: ['youtube.com', 'youtu.be'], endpoint: 'https://www.youtube.com/oembed?format=json&url=' },
  { hosts: ['spotify.com'], endpoint: 'https://open.spotify.com/oembed?url=' },
  { hosts: ['soundcloud.com'], endpoint: 'https://soundcloud.com/oembed?format=json&url=' },
  { hosts: ['vimeo.com'], endpoint: 'https://vimeo.com/api/oembed.json?url=' },
]

interface Preview {
  title?: string
  image?: string
  icon?: string
  site?: string
}

const onHost = (hostname: string, host: string) => hostname === host || hostname.endsWith(`.${host}`)

const reply = (body: Preview | { error: string }, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

export function isPrivateIp(address: string): boolean {
  const ip = address.toLowerCase()
  const v4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip
  if (isIP(v4) === 4) {
    const [a, b] = v4.split('.').map(Number)
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    )
  }
  // ::ffff: in hex form is an IPv4 address in disguise. fc/fd are private, fe8–feb link-local.
  return ip === '::' || ip === '::1' || ip.startsWith('::ffff:') || /^f[cd]/.test(ip) || /^fe[89ab]/.test(ip)
}

/** Throws unless the URL is on a public website. */
export async function assertPublic(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Not a web address')
  if (url.username || url.password) throw new Error('Credentials in URL')
  if (url.port && url.port !== '80' && url.port !== '443') throw new Error('Unusual port')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address)
  if (!addresses.length || addresses.some(isPrivateIp)) throw new Error('Not a public address')
}

const decode = (text: string) =>
  text
    .replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos|nbsp);/gi, (_, entity: string) => {
      const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
      if (entity[0] !== '#') return named[entity.toLowerCase()]
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10)
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''
    })
    .replace(/\s+/g, ' ')
    .trim()

const attributes = (tag: string) =>
  Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)].map((m) => [m[1].toLowerCase(), m[2] ?? m[3] ?? m[4] ?? '']))

/** An https address, resolved against the page. Anything else (data:, javascript:…) is dropped. */
function absolute(value: string | undefined, base: URL): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value, base)
    if (url.protocol === 'http:') url.protocol = 'https:'
    return url.protocol === 'https:' && url.href.length <= MAX_URL ? url.href : undefined
  } catch {
    return undefined
  }
}

const siteName = (url: URL) => url.hostname.replace(/^www\./, '')

export function readPage(html: string, url: URL): Preview {
  const meta = new Map<string, string>()
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const a = attributes(tag)
    const key = (a.property ?? a.name ?? '').toLowerCase()
    if (key && a.content && !meta.has(key)) meta.set(key, decode(a.content))
  }
  const icons = (html.match(/<link\b[^>]*>/gi) ?? []).map(attributes).filter((a) => a.href && /\bicon\b/i.test(a.rel ?? ''))
  const icon = icons.find((a) => /apple-touch/i.test(a.rel)) ?? icons[0]
  return {
    title: (meta.get('og:title') ?? meta.get('twitter:title') ?? decode(html.match(/<title[^>]*>([^<]*)/i)?.[1] ?? '')).slice(0, 200) || undefined,
    image: absolute(meta.get('og:image:secure_url') ?? meta.get('og:image') ?? meta.get('twitter:image') ?? meta.get('twitter:image:src'), url),
    icon: absolute(icon?.href ?? '/favicon.ico', url),
    site: meta.get('og:site_name')?.slice(0, 80) ?? siteName(url),
  }
}

async function readHead(response: Response): Promise<string> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let html = ''
  let size = 0
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    html += decoder.decode(value, { stream: true })
    if (/<\/head>/i.test(html)) break
  }
  await reader.cancel().catch(() => undefined)
  return html
}

async function fromPage(start: URL, signal: AbortSignal): Promise<Preview | null> {
  let url = start
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(url)
    const response = await fetch(url, { redirect: 'manual', signal, headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,image/*;q=0.8' } })
    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel()
      const next = response.headers.get('location')
      if (!next) return null
      url = new URL(next, url)
      continue
    }
    const type = response.headers.get('content-type') ?? ''
    if (response.ok && type.startsWith('image/')) {
      await response.body?.cancel()
      return { image: absolute(url.href, url), site: siteName(url) }
    }
    if (!response.ok || !type.includes('html')) {
      await response.body?.cancel()
      return null
    }
    return readPage(await readHead(response), url)
  }
  return null
}

async function fromOembed(url: URL, signal: AbortSignal): Promise<Preview | null> {
  const service = OEMBED.find((s) => s.hosts.some((host) => onHost(url.hostname, host)))
  if (!service) return null
  // These lookups fail now and then for no lasting reason, and the result is worth a second try.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(service.endpoint + encodeURIComponent(url.href), { signal, headers: { 'User-Agent': USER_AGENT } })
      if (!response.ok) {
        await response.body?.cancel()
        continue
      }
      const data = (await response.json()) as { title?: string; thumbnail_url?: string; provider_name?: string; author_name?: string }
      if (data.title) return { title: data.title.slice(0, 200), image: absolute(data.thumbnail_url, url), site: (data.author_name ?? data.provider_name ?? siteName(url)).slice(0, 80) }
    } catch {
      // Try again, unless time has run out.
    }
  }
  return null
}

export async function POST(request: Request) {
  // Browsers say where a request comes from: only this app may use the function from a web page.
  const from = request.headers.get('sec-fetch-site')
  if (from && from !== 'same-origin') return reply({ error: 'Not allowed' }, 403)

  let url: URL
  try {
    const { url: address } = (await request.json()) as { url?: string }
    if (typeof address !== 'string' || address.length > MAX_URL) throw new Error('Bad address')
    url = new URL(address)
    await assertPublic(url)
  } catch {
    return reply({ error: 'Not a public web address' }, 400)
  }

  const signal = AbortSignal.timeout(TIMEOUT)
  try {
    return reply((await fromOembed(url, signal)) ?? (await fromPage(url, signal)) ?? {})
  } catch {
    // The site refused, timed out or isn't reachable. The app falls back to the address itself.
    return reply({})
  }
}
