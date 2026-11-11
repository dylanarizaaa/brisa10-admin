import { toAppError } from '@/lib/errors'
import { getSupabase } from '@/lib/supabase'
import type { DashboardSummary, RecentMovement } from '../types'

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data, error } = await getSupabase().rpc('get_dashboard_summary')
  if (error) {
    throw toAppError(error, 'No se pudieron cargar los indicadores', {
      PGRST202: 'Falta aplicar la migración del dashboard en Supabase (20261111000002_dashboard_summary.sql)',
    })
  }
  return data
}

export async function getRecentMovements(limit = 8): Promise<RecentMovement[]> {
  const { data, error } = await getSupabase()
    .from('inventory_movements')
    .select('id, type, quantity, created_at, products(name), profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw toAppError(error, 'No se pudo cargar la actividad reciente')
  return data.map(({ products, profiles, ...movement }) => ({
    ...movement,
    product_name: products.name,
    user_name: profiles.full_name,
  }))
}
