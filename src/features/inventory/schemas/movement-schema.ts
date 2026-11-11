import { z } from 'zod'
import type { MovementMode } from '../types'

const MAX_QUANTITY = 1_000_000

export interface MovementValues {
  /** Unidades que entran o salen; en un ajuste, las existencias reales contadas. */
  quantity: string
  reason: string
}

/** El esquema depende de la operación y de las existencias actuales del producto. */
export function movementSchema(mode: MovementMode, currentStock: number) {
  const whole = z
    .string()
    .trim()
    .min(1, 'Ingresa la cantidad')
    .regex(/^\d+$/, 'Debe ser un número entero, sin puntos ni comas')
    .refine((value) => Number(value) <= MAX_QUANTITY, 'La cantidad es demasiado grande')

  const quantity =
    mode === 'ajuste'
      ? whole.refine((value) => Number(value) !== currentStock, 'Es igual a las existencias actuales')
      : mode === 'salida'
        ? whole
            .refine((value) => Number(value) > 0, 'Debe ser mayor que cero')
            .refine((value) => Number(value) <= currentStock, `Solo hay ${currentStock} en existencias`)
        : whole.refine((value) => Number(value) > 0, 'Debe ser mayor que cero')

  const reason = z.string().trim().max(300, 'Máximo 300 caracteres')

  return z.object({
    quantity,
    reason: mode === 'entrada' ? reason : reason.min(1, 'Indica el motivo'),
  }) satisfies z.ZodType<MovementValues>
}
