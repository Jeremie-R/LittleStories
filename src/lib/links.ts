/** "@name", "instagram.com/name/" or "name" → "name" */
export const instagramHandle = (raw?: string) =>
  raw
    ?.trim()
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/[/?].*$/, '') || undefined

/**
 * A safe https link from whatever was pasted. A link to the site is kept whole (Facebook
 * profiles can be profile.php?id=…), and anything else is treated as a username.
 */
function profileLink(raw: string | undefined, hosts: string[], usernameBase: string): string | undefined {
  const value = raw?.trim().replace(/^@/, '')
  if (!value) return undefined
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    if (hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
      url.protocol = 'https:'
      return url.href
    }
  } catch {
    // Not a link, so it's a username.
  }
  return usernameBase + encodeURIComponent(value)
}

export const facebookLink = (raw?: string) => profileLink(raw, ['facebook.com', 'fb.com', 'fb.me'], 'https://www.facebook.com/')

export const linkedinLink = (raw?: string) => profileLink(raw, ['linkedin.com'], 'https://www.linkedin.com/in/')
