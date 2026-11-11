import { toAppError } from '@/lib/errors'
import { getSupabase } from '@/lib/supabase'
import type { UserRole } from '@/types/database'
import type { BusinessValues } from '../schemas/settings-schema'
import type { BusinessSettings, UserAccount } from '../types'

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const { data, error } = await getSupabase().from('business_settings').select('*').single()
  if (error) throw toAppError(error, 'No se pudo cargar la configuración del negocio')
  return data
}

export async function updateBusinessSettings(values: BusinessValues): Promise<void> {
  const { data, error } = await getSupabase()
    .from('business_settings')
    .update({
      business_name: values.businessName,
      nit: values.nit || null,
      phone: values.phone || null,
      address: values.address || null,
      email: values.email || null,
      low_stock_threshold: Number(values.lowStockThreshold),
    })
    .eq('id', true)
    .select('id')
  if (error) throw toAppError(error, 'No se pudo guardar la configuración')
  // RLS no devuelve error cuando bloquea una actualización: simplemente no cambia ninguna fila.
  if (data.length === 0) throw new Error('No tienes permiso para cambiar la configuración')
}

/** Solo administradores: la función RPC rechaza a los demás. */
export async function listUsers(): Promise<UserAccount[]> {
  const { data, error } = await getSupabase().rpc('list_users')
  if (error) {
    throw toAppError(error, 'No se pudieron cargar los usuarios', {
      PGRST202: 'Falta aplicar la migración de usuarios en Supabase (20261111000006_history_reports_users.sql)',
    })
  }
  return data
}

export async function updateUser(id: string, changes: { role?: UserRole; is_active?: boolean }): Promise<void> {
  const { data, error } = await getSupabase().from('profiles').update(changes).eq('id', id).select('id')
  if (error) throw toAppError(error, 'No se pudo actualizar el usuario')
  if (data.length === 0) throw new Error('No tienes permiso para cambiar este usuario')
}

export async function updateOwnName(id: string, fullName: string): Promise<void> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', id)
    .select('id')
  if (error) throw toAppError(error, 'No se pudo guardar tu nombre')
  if (data.length === 0) throw new Error('No se pudo guardar tu nombre')
}
