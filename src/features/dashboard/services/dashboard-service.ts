import { toAppError } from '@/lib/errors'
import { getSupabase } from '@/lib/supabase'
import type { SalesByDay, TopProduct } from '@/types/database'
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

export async function getTopProducts(days: number, limit: number): Promise<TopProduct[]> {
  const { data, error } = await getSupabase().rpc('get_top_products', { p_days: days, p_limit: limit })
  if (error) {
    throw toAppError(error, 'No se pudieron cargar los productos más vendidos', {
      PGRST202: 'Falta aplicar la migración de ventas en Supabase (20261111000005_sales.sql)',
    })
  }
  return data
}

export async function getSalesByDay(days: number): Promise<SalesByDay[]> {
  const { data, error } = await getSupabase().rpc('get_sales_by_day', { p_days: days })
  if (error) {
    throw toAppError(error, 'No se pudieron cargar las ventas por día', {
      PGRST202: 'Falta aplicar la migración de reportes en Supabase (20261111000006_history_reports_users.sql)',
    })
  }
  return data
}
