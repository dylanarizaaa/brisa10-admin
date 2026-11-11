import { toAppError } from '@/lib/errors'
import { getSupabase } from '@/lib/supabase'

// El frontend nunca escribe products.stock: todo cambio pasa por estas funciones RPC,
// que validan, actualizan las existencias y registran el movimiento en una transacción.

export interface RegisterMovementInput {
  productId: string
  type: 'entrada' | 'salida'
  /** Siempre positivo; la base de datos decide el signo según el tipo. */
  quantity: number
  reason?: string
}

export async function registerMovement(input: RegisterMovementInput): Promise<void> {
  const { error } = await getSupabase().rpc('register_inventory_movement', {
    p_product_id: input.productId,
    p_type: input.type,
    p_quantity: input.quantity,
    p_reason: input.reason?.trim() || undefined,
  })
  if (error) throw toAppError(error, 'No se pudo registrar el movimiento')
}

export interface AdjustInventoryInput {
  productId: string
  /** Existencias reales contadas (valor final, no la diferencia). */
  newStock: number
  reason: string
}

export async function adjustInventory(input: AdjustInventoryInput): Promise<void> {
  const { error } = await getSupabase().rpc('adjust_inventory', {
    p_product_id: input.productId,
    p_new_stock: input.newStock,
    p_reason: input.reason.trim(),
  })
  if (error) throw toAppError(error, 'No se pudo guardar el ajuste')
}
