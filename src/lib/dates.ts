// Colombia no tiene horario de verano: su desfase con UTC es siempre -05:00.
const BOGOTA_OFFSET = '-05:00'

export function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

/** Inicio del día (AAAA-MM-DD) en hora de Colombia, como instante con zona. */
export function startOfDay(date: string): string {
  return `${date}T00:00:00${BOGOTA_OFFSET}`
}

/** Inicio del día siguiente: límite superior exclusivo para filtrar "hasta" una fecha incluida. */
export function startOfNextDay(date: string): string {
  const next = new Date(`${date}T00:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  return startOfDay(next.toISOString().slice(0, 10))
}
