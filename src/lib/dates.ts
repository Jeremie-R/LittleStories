// Days are stored as YYYY-MM-DD strings and read as local dates, so a story written
// on the 3rd stays on the 3rd whatever the time zone.

const LOCALE = 'en-GB'

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(time: number | Date = Date.now()): string {
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

/** "YYYY-MM" */
export const monthKey = (day: string) => day.slice(0, 7)

const dayFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' })
const dayShortFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })
const dayNoYearFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' })
const monthFormat = new Intl.DateTimeFormat(LOCALE, { month: 'short', year: 'numeric' })
const monthLongFormat = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' })
const monthNameFormat = new Intl.DateTimeFormat(LOCALE, { month: 'short' })

/** "22 March 2025" */
export const formatDay = (day: string) => dayFormat.format(parseDay(day))
/** "22 Mar 2025" */
export const formatDayShort = (day: string) => dayShortFormat.format(parseDay(day))
/** "March 2025" from YYYY-MM */
export const formatMonth = (month: string) => monthLongFormat.format(parseDay(month))
/** "Jan" … "Dec" for 0–11 */
export const monthName = (index: number) => monthNameFormat.format(new Date(2000, index, 1))

/**
 * How a time with someone reads: one date when it was a single day, "Since …" while it's
 * still going, otherwise a range. `short` drops the days for long ranges (list cards).
 */
export function formatRange(start?: string, end?: string, short = false): string {
  if (!start && !end) return ''
  if (start && !end) return `Since ${short ? monthFormat.format(parseDay(start)) : formatDayShort(start)}`
  if (!start && end) return `Until ${short ? monthFormat.format(parseDay(end)) : formatDayShort(end)}`
  const a = parseDay(start!)
  const b = parseDay(end!)
  if (start === end) return formatDayShort(start!)
  if (a.getFullYear() === b.getFullYear()) {
    if (short && a.getMonth() !== b.getMonth()) return `${monthNameFormat.format(a)} – ${monthFormat.format(b)}`
    return `${dayNoYearFormat.format(a)} – ${dayShortFormat.format(b)}`
  }
  return short ? `${monthFormat.format(a)} – ${monthFormat.format(b)}` : `${dayShortFormat.format(a)} – ${dayShortFormat.format(b)}`
}

/** Whole days from start to end (or today, while it's still going), counting both ends. */
export function daysBetween(start: string, end?: string): number {
  const ms = parseDay(end ?? dayKey()).getTime() - parseDay(start).getTime()
  return Math.max(1, Math.round(ms / 86_400_000) + 1)
}

/** "1 day", "3 weeks", "8 months", "2 years" */
export function formatDuration(days: number): string {
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`
  if (days < 14) return plural(days, 'day')
  if (days < 61) return plural(Math.round(days / 7), 'week')
  if (days < 730) return plural(Math.round(days / 30.44), 'month')
  const years = days / 365.25
  return years < 10 && years % 1 >= 0.25 && years % 1 < 0.75 ? `${Math.floor(years)}½ years` : plural(Math.round(years), 'year')
}
