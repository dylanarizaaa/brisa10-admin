import type { Tables } from '@/types/database'

export type Category = Tables<'categories'> & {
  /** Cantidad de productos asociados a la categoría. */
  product_count: number
}

export type CategoryStatusFilter = 'all' | 'active' | 'inactive'
