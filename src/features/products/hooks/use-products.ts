import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCurrentUser } from '@/features/auth/auth-context'
import { categoriesKey } from '@/features/categories/hooks/use-categories'
import { dashboardKey } from '@/features/dashboard/hooks/use-dashboard'
import type { ProductValues } from '../schemas/product-schema'
import {
  deleteProductImage,
  reorderProductImages,
  uploadProductImage,
} from '../services/product-image-service'
import {
  createProduct,
  getProduct,
  listProducts,
  setProductActive,
  updateProduct,
} from '../services/product-service'
import type { ProductFilters, ProductImage } from '../types'

export const productsKey = ['products'] as const

/** Un cambio en productos afecta también los contadores del dashboard y de categorías. */
function invalidateProducts(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: productsKey }),
    queryClient.invalidateQueries({ queryKey: dashboardKey }),
    queryClient.invalidateQueries({ queryKey: categoriesKey }),
  ])
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: [...productsKey, 'list', filters],
    queryFn: () => listProducts(filters),
    // Mantiene la página anterior visible mientras llega la nueva (sin parpadeos al filtrar).
    placeholderData: keepPreviousData,
  })
}

export function useProduct(id: string) {
  const { isAdmin } = useCurrentUser()
  return useQuery({
    queryKey: [...productsKey, 'detail', id, { isAdmin }],
    queryFn: () => getProduct(id, isAdmin),
  })
}

/** Crea un producto, o lo edita si se indica `id`. Devuelve el id del producto guardado. */
export function useSaveProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: ProductValues }) => {
      if (!id) return createProduct(values)
      await updateProduct(id, values)
      return id
    },
    onSuccess: (_id, { id }) => {
      toast.success(id ? 'Producto actualizado' : 'Producto creado')
    },
    // También tras un error: el producto pudo guardarse aunque fallara el costo.
    onSettled: () => invalidateProducts(queryClient),
  })
}

export function useSetProductActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setProductActive(id, isActive),
    onSuccess: (_data, { isActive }) => {
      toast.success(isActive ? 'Producto activado' : 'Producto desactivado')
      return invalidateProducts(queryClient)
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUploadProductImages(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    /** Sube los archivos uno por uno; devuelve los mensajes de los que fallaron. */
    mutationFn: async ({ files, startPosition }: { files: File[]; startPosition: number }) => {
      const errors: string[] = []
      let position = startPosition
      for (const file of files) {
        try {
          await uploadProductImage(productId, file, position)
          position += 1
        } catch (error) {
          errors.push(error instanceof Error ? error.message : `No se pudo subir "${file.name}"`)
        }
      }
      return { uploaded: position - startPosition, errors }
    },
    onSuccess: ({ uploaded, errors }) => {
      if (uploaded > 0) toast.success(uploaded === 1 ? 'Fotografía agregada' : `${uploaded} fotografías agregadas`)
      errors.forEach((message) => toast.error(message))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: productsKey }),
  })
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (image: ProductImage) => deleteProductImage(image),
    onSuccess: () => {
      toast.success('Fotografía eliminada')
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: productsKey }),
  })
}

export function useReorderProductImages() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderProductImages(orderedIds),
    onSuccess: () => {
      toast.success('Fotografía principal actualizada')
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: productsKey }),
  })
}
