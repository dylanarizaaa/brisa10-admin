import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { dashboardKey } from '@/features/dashboard/hooks/use-dashboard'
import { movementsKey } from '@/features/movements/hooks/use-movements'
import { productsKey } from '@/features/products/hooks/use-products'
import type { UserRole } from '@/types/database'
import type { BusinessValues } from '../schemas/settings-schema'
import {
  getBusinessSettings,
  listUsers,
  updateBusinessSettings,
  updateOwnName,
  updateUser,
} from '../services/settings-service'

export const settingsKey = ['settings'] as const
const usersKey = [...settingsKey, 'users'] as const

export function useBusinessSettings() {
  return useQuery({
    queryKey: [...settingsKey, 'business'],
    queryFn: getBusinessSettings,
    staleTime: 5 * 60_000,
  })
}

export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: BusinessValues) => updateBusinessSettings(values),
    onSuccess: () => {
      toast.success('Configuración guardada')
      // El umbral de bajo inventario cambia el estado de los productos y los indicadores.
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: settingsKey }),
        queryClient.invalidateQueries({ queryKey: productsKey }),
        queryClient.invalidateQueries({ queryKey: dashboardKey }),
      ])
    },
  })
}

export function useUsers() {
  return useQuery({ queryKey: usersKey, queryFn: listUsers })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...changes }: { id: string; role?: UserRole; is_active?: boolean }) =>
      updateUser(id, changes),
    onSuccess: () => {
      toast.success('Usuario actualizado')
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: usersKey }),
  })
}

export function useUpdateOwnName(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fullName: string) => updateOwnName(userId, fullName),
    onSuccess: () => {
      toast.success('Nombre actualizado')
      // El nombre aparece en el menú de usuario, la lista de usuarios y los historiales.
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: usersKey }),
        queryClient.invalidateQueries({ queryKey: movementsKey }),
      ])
    },
  })
}
