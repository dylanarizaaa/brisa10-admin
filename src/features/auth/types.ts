import type { Tables, UserRole } from '@/types/database'

export type Profile = Tables<'profiles'>

export const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  operador: 'Operador',
}
