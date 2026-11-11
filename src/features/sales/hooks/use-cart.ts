import { useCallback, useMemo, useState } from 'react'
import type { Product } from '@/features/products/types'
import type { CartLine } from '../types'

/** Carrito de la venta en curso. Vive en memoria: se pierde al salir de la página. */
export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([])

  /** Agrega una unidad del producto (o suma una si ya está), sin pasar de las existencias. */
  const add = useCallback((product: Product) => {
    if (product.stock <= 0) return
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id)
      if (!existing) {
        return [
          ...current,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            stock: product.stock,
            imagePath: product.main_image_path,
            quantity: 1,
          },
        ]
      }
      return current.map((line) =>
        line.productId === product.id
          ? // Se actualizan precio y existencias por si cambiaron desde que se agregó.
            { ...line, price: product.price, stock: product.stock, quantity: Math.min(line.quantity + 1, product.stock) }
          : line,
      )
    })
  }, [])

  /** Fija la cantidad de una línea, entre 1 y las existencias. */
  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((current) =>
      current.map((line) =>
        line.productId === productId
          ? { ...line, quantity: Math.max(1, Math.min(Math.trunc(quantity) || 1, line.stock)) }
          : line,
      ),
    )
  }, [])

  const remove = useCallback((productId: string) => {
    setLines((current) => current.filter((line) => line.productId !== productId))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const total = useMemo(() => lines.reduce((sum, line) => sum + line.price * line.quantity, 0), [lines])
  const units = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines])

  return { lines, total, units, add, setQuantity, remove, clear }
}

export type Cart = ReturnType<typeof useCart>
