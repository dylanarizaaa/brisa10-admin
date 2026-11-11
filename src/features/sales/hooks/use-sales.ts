import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { dashboardKey } from '@/features/dashboard/hooks/use-dashboard'
import { productsKey } from '@/features/products/hooks/use-products'
import { cancelSale, createSale, getSale, listSales, type CreateSaleInput } from '../services/sale-service'
import type { SaleFilters } from '../types'

export const salesKey = ['sales'] as const

/** Una venta o su anulación cambia existencias e indicadores. */
function invalidateSales(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: salesKey }),
    queryClient.invalidateQueries({ queryKey: productsKey }),
    queryClient.invalidateQueries({ queryKey: dashboardKey }),
  ])
}

export function useSales(filters: SaleFilters) {
  return useQuery({
    queryKey: [...salesKey, 'list', filters],
    queryFn: () => listSales(filters),
    placeholderData: keepPreviousData,
  })
}

export function useSale(id: string) {
  return useQuery({ queryKey: [...salesKey, 'detail', id], queryFn: () => getSale(id) })
}

export function useCreateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSaleInput) => createSale(input),
    onSuccess: ({ saleNumber }) => {
      toast.success(`Venta N.º ${saleNumber} registrada`)
    },
    // También tras un error: si faltaron existencias, la lista de productos debe refrescarse.
    onSettled: () => invalidateSales(queryClient),
  })
}

export function useCancelSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelSale(id, reason),
    onSuccess: () => {
      toast.success('Venta anulada. Las existencias fueron devueltas al inventario')
    },
    onSettled: () => invalidateSales(queryClient),
  })
}
