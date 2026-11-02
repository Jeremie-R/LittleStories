import isoCountries from 'i18n-iso-countries'

export interface Country {
  /** ISO 3166-1 alpha-2 */
  code: string
  name: string
  flag: string
}

const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })

// Intl's names are written for menus of regions; a few read better shortened.
const RENAMED: Record<string, string> = {
  HK: 'Hong Kong',
  MO: 'Macao',
  MM: 'Myanmar',
  PS: 'Palestine',
  CD: 'DR Congo',
  CG: 'Congo',
  CI: "Côte d'Ivoire",
  MK: 'North Macedonia',
}

export function countryName(code: string): string {
  if (RENAMED[code]) return RENAMED[code]
  try {
    return displayNames.of(code) ?? code
  } catch {
    return code
  }
}

/** The flag emoji, built from the regional indicator letters. */
export const flag = (code: string) =>
  String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))

export const COUNTRIES: Country[] = Object.keys(isoCountries.getAlpha2Codes())
  .concat('XK')
  .filter((code, i, all) => all.indexOf(code) === i && code !== 'AQ')
  .map((code) => ({ code, name: countryName(code), flag: flag(code) }))
  .sort((a, b) => a.name.localeCompare(b.name))

// Map shapes without an ISO number, folded into the country they belong to.
const UNNUMBERED: Record<string, string> = {
  Kosovo: 'XK',
  Somaliland: 'SO',
  'N. Cyprus': 'CY',
}

/** Country code for a world-atlas shape (ISO numeric id, or a name for the few without one). */
export function codeForShape(id: string | number | undefined, name: string): string | undefined {
  if (id !== undefined) return isoCountries.numericToAlpha2(id)
  return UNNUMBERED[name]
}
