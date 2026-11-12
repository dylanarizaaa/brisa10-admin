import { z } from 'zod'

// Los campos numéricos se validan como texto (así llegan del formulario) y se convierten al guardar.
const MAX_INT = 2_000_000_000

function wholeNumber(label: string) {
  return z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} debe ser un número entero, sin puntos ni comas`)
    .refine((value) => Number(value) <= MAX_INT, `${label} es demasiado grande`)
}

function optionalWholeNumber(label: string) {
  return z.union([z.literal(''), wholeNumber(label)])
}

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Ingresa el nombre del producto').max(120, 'Máximo 120 caracteres'),
  sku: z.string().trim().max(40, 'Máximo 40 caracteres'),
  description: z.string().trim().max(1000, 'Máximo 1000 caracteres'),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  price: z
    .string()
    .trim()
    .min(1, 'Ingresa el precio de venta')
    .pipe(wholeNumber('El precio')),
  cost: optionalWholeNumber('El costo'),
  minStock: optionalWholeNumber('El stock mínimo'),
  /** Visible en la tienda virtual (además debe estar activo). */
  isPublished: z.boolean(),
  /** Aparece en la sección de destacados de la tienda virtual. */
  isFeatured: z.boolean(),
  /** Solo al crear: se registra como una entrada de inventario. */
  initialStock: optionalWholeNumber('Las existencias iniciales'),
})

export type ProductValues = z.infer<typeof productSchema>
