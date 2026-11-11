import type { PaymentMethod, SaleStatus, Tables } from '@/types/database'

export type Sale = Tables<'sales'> & {
  seller_name: string
}

export type SaleItem = Tables<'sale_items'>

export interface SaleDetail extends Sale {
  items: SaleItem[]
  cancelled_by_name: string | null
}

export type SaleStatusFilter = 'all' | SaleStatus
export type PaymentFilter = 'all' | PaymentMethod

export interface SaleFilters {
  status: SaleStatusFilter
  payment: PaymentFilter
  /** Fechas en formato AAAA-MM-DD (hora de Colombia), ambas incluidas. */
  from: string
  to: string
  page: number
}

export interface SalePage {
  items: Sale[]
  total: number
}

export const SALES_PAGE_SIZE = 10

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
}

export const paymentMethods = Object.keys(paymentMethodLabels) as PaymentMethod[]

export const saleStatusLabels: Record<SaleStatus, string> = {
  completada: 'Completada',
  anulada: 'Anulada',
}

/** Línea del carrito: copia de los datos del producto al momento de agregarlo. */
export interface CartLine {
  productId: string
  name: string
  sku: string | null
  price: number
  /** Existencias conocidas al agregar; la base de datos vuelve a validar al confirmar. */
  stock: number
  imagePath: string | null
  quantity: number
}
