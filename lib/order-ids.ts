const ORDER_ID_TIMEZONE = "America/New_York"

function getTimezoneDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: ORDER_ID_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  const parts = formatter.formatToParts(date)
  const lookup = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]))

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
  }
}

function getDayOfYear(year: number, month: number, day: number) {
  const start = Date.UTC(year, 0, 1)
  const current = Date.UTC(year, month - 1, day)
  return Math.floor((current - start) / 86_400_000) + 1
}

export function buildOrderDayPrefix(date = new Date()) {
  const { year, month, day } = getTimezoneDateParts(date)
  const yy = String(year).slice(-2)
  const dayOfYear = String(getDayOfYear(year, month, day)).padStart(3, "0")
  return `${yy}${dayOfYear}`
}

export function buildOrderIdFromSequence(sequence: number, date = new Date()) {
  return `${buildOrderDayPrefix(date)}${String(sequence).padStart(2, "0")}`
}

export function parseOrderSequence(orderId: string, prefix: string) {
  if (!orderId.startsWith(prefix)) return null
  const suffix = orderId.slice(prefix.length)
  const sequence = Number(suffix)
  return Number.isFinite(sequence) ? sequence : null
}
