import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { dashboardKey } from '@/features/dashboard/hooks/use-dashboard'
import { productsKey } from '@/features/products/hooks/use-products'
import { adjustInventory, registerMovement } from '../services/inventory-service'
import { movementModeLabels, type MovementMode } from '../types'

interface StockOperation {
  productId: string
  mode: MovementMode
  /** Unidades (entrada/salida) o existencias contadas (ajuste). */
  quantity: number
  reason: string
}

export function useStockOperation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, mode, quantity, reason }: StockOperation) =>
      mode === 'ajuste'
        ? adjustInventory({ productId, newStock: quantity, reason })
        : registerMovement({ productId, type: mode, quantity, reason }),
    onSuccess: (_data, { mode }) => {
      toast.success(movementModeLabels[mode].success)
    },
    // También tras un error: las existencias pudieron cambiar por otra operación.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: productsKey }),
        queryClient.invalidateQueries({ queryKey: dashboardKey }),
      ]),
  })
}
