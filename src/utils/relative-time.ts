const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

function unit(value: number, name: string) {
  return `${value} ${name}${value === 1 ? '' : 's'} ago`
}

export function relativeTime(value: string) {
  const elapsed = Date.now() - new Date(value).getTime()
  if (!Number.isFinite(elapsed) || elapsed < 0) return ''
  if (elapsed < MINUTE) return 'just now'
  if (elapsed < HOUR) return unit(Math.floor(elapsed / MINUTE), 'minute')
  if (elapsed < DAY) return unit(Math.floor(elapsed / HOUR), 'hour')
  if (elapsed < WEEK) return unit(Math.floor(elapsed / DAY), 'day')
  if (elapsed < MONTH) return unit(Math.floor(elapsed / WEEK), 'week')
  if (elapsed < YEAR) return unit(Math.floor(elapsed / MONTH), 'month')
  return unit(Math.floor(elapsed / YEAR), 'year')
}
