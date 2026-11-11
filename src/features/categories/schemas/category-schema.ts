import { z } from 'zod'

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ingresa el nombre de la categoría')
    .max(60, 'El nombre no puede superar los 60 caracteres'),
  description: z.string().trim().max(200, 'La descripción no puede superar los 200 caracteres'),
})

export type CategoryValues = z.infer<typeof categorySchema>
