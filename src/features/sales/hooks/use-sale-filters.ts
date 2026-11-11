import { useMemo } from 'react'
import { oneOf, useUrlParams } from '@/hooks/use-url-params'
import { paymentMethods, type PaymentFilter, type SaleFilters, type SaleStatusFilter } from '../types'

const statusValues: SaleStatusFilter[] = ['all', 'completada', 'anulada']
const paymentValues: PaymentFilter[] = ['all', ...paymentMethods]

/** Filtros del historial de ventas, guardados en la URL. */
export function useSaleFilters() {
  const { params, page, setParam } = useUrlParams<'estado' | 'pago' | 'desde' | 'hasta'>()

  const filters = useMemo<SaleFilters>(
    () => ({
      status: oneOf(params.get('estado'), statusValues, 'all'),
      payment: oneOf(params.get('pago'), paymentValues, 'all'),
      from: params.get('desde') ?? '',
      to: params.get('hasta') ?? '',
      page,
    }),
    [params, page],
  )

  const hasFilters =
    filters.status !== 'all' || filters.payment !== 'all' || filters.from !== '' || filters.to !== ''

  return { filters, setParam, hasFilters }
}
