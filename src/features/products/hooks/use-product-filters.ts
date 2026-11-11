import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { ActiveFilter, AvailabilityFilter, ProductFilters } from '../types'

const availabilityValues: AvailabilityFilter[] = ['all', 'in_stock', 'low', 'out']
const activeValues: ActiveFilter[] = ['all', 'active', 'inactive']

function oneOf<T extends string>(value: string | null, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

/**
 * Filtros de la lista de productos guardados en la URL:
 * sobreviven a recargar, al botón atrás y se pueden compartir.
 */
export function useProductFilters() {
  const [params, setParams] = useSearchParams()

  const filters = useMemo<ProductFilters>(
    () => ({
      search: params.get('q') ?? '',
      categoryId: params.get('categoria'),
      availability: oneOf(params.get('existencias'), availabilityValues, 'all'),
      active: oneOf(params.get('estado'), activeValues, 'all'),
      page: Math.max(1, Number.parseInt(params.get('pagina') ?? '1', 10) || 1),
    }),
    [params],
  )

  /** Cambia un parámetro; cualquier cambio de filtro vuelve a la primera página. */
  const setParam = useCallback(
    (key: 'q' | 'categoria' | 'existencias' | 'estado' | 'pagina', value: string | null) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (value === null || value === '' || value === 'all') next.delete(key)
          else next.set(key, value)
          if (key !== 'pagina') next.delete('pagina')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const hasFilters =
    filters.search.trim() !== '' ||
    filters.categoryId !== null ||
    filters.availability !== 'all' ||
    filters.active !== 'all'

  return { filters, setParam, hasFilters }
}
