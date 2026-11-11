import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { CategoryValues } from '../schemas/category-schema'
import {
  createCategory,
  listCategories,
  setCategoryActive,
  updateCategory,
} from '../services/category-service'

export const categoriesKey = ['categories'] as const

export function useCategories() {
  return useQuery({ queryKey: categoriesKey, queryFn: listCategories })
}

/** Crea una categoría, o la edita si se indica `id`. */
export function useSaveCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: CategoryValues }) =>
      id ? updateCategory(id, values) : createCategory(values),
    onSuccess: (_data, { id }) => {
      toast.success(id ? 'Categoría actualizada' : 'Categoría creada')
      return queryClient.invalidateQueries({ queryKey: categoriesKey })
    },
  })
}

export function useSetCategoryActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setCategoryActive(id, isActive),
    onSuccess: (_data, { isActive }) => {
      toast.success(isActive ? 'Categoría activada' : 'Categoría desactivada')
      return queryClient.invalidateQueries({ queryKey: categoriesKey })
    },
    onError: (error) => toast.error(error.message),
  })
}
