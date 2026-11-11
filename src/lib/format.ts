const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Formatea un valor en pesos colombianos, sin decimales: 25000 → "$ 25.000". */
export function formatCOP(value: number): string {
  return copFormatter.format(value)
}

export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(typeof value === 'string' ? new Date(value) : value)
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' })

export function formatDate(value: string | Date): string {
  return dateFormatter.format(typeof value === 'string' ? new Date(value) : value)
}
