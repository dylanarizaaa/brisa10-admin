import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { oneOf, useUrlParams } from '@/hooks/use-url-params'
import type { MovementType } from '@/types/database'
import { listMovements, listMovementUsers } from '../services/movement-service'
import { movementTypes, type MovementFilters } from '../types'

export const movementsKey = ['movements'] as const

const typeValues: (MovementType | 'all')[] = ['all', ...movementTypes]

export function useMovements(filters: MovementFilters) {
  return useQuery({
    queryKey: [...movementsKey, 'list', filters],
    queryFn: () => listMovements(filters),
    placeholderData: keepPreviousData,
    // El historial cambia con cada venta o movimiento hecho en otras pantallas:
    // se vuelve a consultar siempre que se abre.
    staleTime: 0,
  })
}

export function useMovementUsers() {
  return useQuery({ queryKey: [...movementsKey, 'users'], queryFn: listMovementUsers, staleTime: 5 * 60_000 })
}

/** Filtros del historial de movimientos, guardados en la URL. */
export function useMovementFilters() {
  const { params, page, setParam } = useUrlParams<'q' | 'tipo' | 'usuario' | 'desde' | 'hasta'>()

  const filters = useMemo<MovementFilters>(
    () => ({
      search: params.get('q') ?? '',
      type: oneOf(params.get('tipo'), typeValues, 'all'),
      userId: params.get('usuario'),
      from: params.get('desde') ?? '',
      to: params.get('hasta') ?? '',
      page,
    }),
    [params, page],
  )

  const hasFilters =
    filters.search.trim() !== '' ||
    filters.type !== 'all' ||
    filters.userId !== null ||
    filters.from !== '' ||
    filters.to !== ''

  return { filters, setParam, hasFilters }
}
