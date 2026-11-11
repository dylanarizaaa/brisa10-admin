import { z } from 'zod'

const optionalText = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`)

export const businessSchema = z.object({
  businessName: z.string().trim().min(1, 'Ingresa el nombre del negocio').max(80, 'Máximo 80 caracteres'),
  nit: optionalText(30),
  phone: optionalText(30),
  address: optionalText(150),
  email: z.union([z.literal(''), z.email('Ingresa un correo válido')]),
  lowStockThreshold: z
    .string()
    .trim()
    .min(1, 'Ingresa el umbral')
    .regex(/^\d+$/, 'Debe ser un número entero, sin puntos ni comas')
    .refine((value) => Number(value) <= 100000, 'El umbral es demasiado grande'),
})

export type BusinessValues = z.infer<typeof businessSchema>

export const accountSchema = z.object({
  fullName: z.string().trim().min(1, 'Ingresa tu nombre').max(80, 'Máximo 80 caracteres'),
})

export type AccountValues = z.infer<typeof accountSchema>
