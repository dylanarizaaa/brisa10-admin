import type { StockStatus, Tables, Views } from '@/types/database'

/** Producto tal como lo expone la vista product_list (con categoría y estado de existencias). */
export type Product = Views<'product_list'>

export type ProductImage = Tables<'product_images'>

/** Producto con todo lo necesario para la vista de detalle y el formulario de edición. */
export interface ProductDetail extends Product {
  images: ProductImage[]
  /** Costo de adquisición. Siempre null para quien no es administrador. */
  cost: number | null
}

export type AvailabilityFilter = 'all' | 'in_stock' | 'low' | 'out'
export type ActiveFilter = 'all' | 'active' | 'inactive'

export interface ProductFilters {
  search: string
  categoryId: string | null
  availability: AvailabilityFilter
  active: ActiveFilter
  page: number
}

export interface ProductPage {
  items: Product[]
  total: number
}

export const PRODUCTS_PAGE_SIZE = 10

export const stockStatusLabels: Record<StockStatus, string> = {
  disponible: 'Disponible',
  bajo: 'Bajo inventario',
  agotado: 'Agotado',
}
