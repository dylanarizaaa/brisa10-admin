import { useMemo } from 'react'
import { oneOf, useUrlParams } from '@/hooks/use-url-params'
import type { ActiveFilter, AvailabilityFilter, ProductFilters } from '../types'

const availabilityValues: AvailabilityFilter[] = ['all', 'in_stock', 'low', 'out']
const activeValues: ActiveFilter[] = ['all', 'active', 'inactive']

/** Filtros de la lista de productos, guardados en la URL. */
export function useProductFilters() {
  const { params, page, setParam } = useUrlParams<'q' | 'categoria' | 'existencias' | 'estado'>()

  const filters = useMemo<ProductFilters>(
    () => ({
      search: params.get('q') ?? '',
      categoryId: params.get('categoria'),
      availability: oneOf(params.get('existencias'), availabilityValues, 'all'),
      active: oneOf(params.get('estado'), activeValues, 'all'),
      page,
    }),
    [params, page],
  )

  const hasFilters =
    filters.search.trim() !== '' ||
    filters.categoryId !== null ||
    filters.availability !== 'all' ||
    filters.active !== 'all'

  return { filters, setParam, hasFilters }
}
