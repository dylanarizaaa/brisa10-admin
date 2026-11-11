import { z } from 'zod'

export const cancelSaleSchema = z.object({
  reason: z.string().trim().min(1, 'Indica el motivo de la anulación').max(300, 'Máximo 300 caracteres'),
})

export type CancelSaleValues = z.infer<typeof cancelSaleSchema>

export const NOTES_MAX_LENGTH = 300
