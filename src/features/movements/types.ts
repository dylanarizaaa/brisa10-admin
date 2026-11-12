import type { MovementType, Views } from '@/types/database'

export type Movement = Views<'movement_list'>

export const movementTypeLabels: Record<MovementType, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
  venta: 'Venta',
  cancelacion: 'Anulación de venta',
  devolucion: 'Devolución',
}

export const movementTypes = Object.keys(movementTypeLabels) as MovementType[]

export interface MovementFilters {
  /** Nombre o código del producto. */
  search: string
  type: MovementType | 'all'
  userId: string | null
  /** Fechas AAAA-MM-DD (hora de Colombia), ambas incluidas. */
  from: string
  to: string
  page: number
}

export interface MovementPage {
  items: Movement[]
  total: number
}

export const MOVEMENTS_PAGE_SIZE = 15
