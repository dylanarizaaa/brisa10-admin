import { isDateString, startOfDay, startOfNextDay } from '@/lib/dates'
import { toAppError } from '@/lib/errors'
import { getSupabase } from '@/lib/supabase'
import { normalizeText } from '@/lib/text'
import { MOVEMENTS_PAGE_SIZE, type MovementFilters, type MovementPage } from '../types'

// El historial es de solo lectura: los movimientos se crean únicamente desde las
// funciones RPC de inventario y ventas, y la base de datos impide modificarlos.

export async function listMovements(filters: MovementFilters): Promise<MovementPage> {
  let query = getSupabase().from('movement_list').select('*', { count: 'exact' })

  const term = normalizeText(filters.search.trim())
  if (term) query = query.ilike('search_text', `%${term.replace(/[\\%_]/g, '\\$&')}%`)
  if (filters.type !== 'all') query = query.eq('type', filters.type)
  if (filters.userId) query = query.eq('created_by', filters.userId)
  if (isDateString(filters.from)) query = query.gte('created_at', startOfDay(filters.from))
  if (isDateString(filters.to)) query = query.lt('created_at', startOfNextDay(filters.to))

  const from = (filters.page - 1) * MOVEMENTS_PAGE_SIZE
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .order('id')
    .range(from, from + MOVEMENTS_PAGE_SIZE - 1)

  if (error) {
    if (error.code === 'PGRST103') return { items: [], total: 0 }
    // 22P02: el usuario de la URL no es un UUID válido → ningún resultado.
    if (error.code === '22P02') return { items: [], total: 0 }
    throw toAppError(error, 'No se pudo cargar el historial de movimientos', {
      PGRST205: 'Falta aplicar la migración del historial en Supabase (20261111000006_history_reports_users.sql)',
    })
  }
  return { items: data, total: count ?? 0 }
}

/** Usuarios para el filtro "responsable" (incluye inactivos: pueden tener movimientos antiguos). */
export async function listMovementUsers(): Promise<{ id: string; full_name: string }[]> {
  const { data, error } = await getSupabase().from('profiles').select('id, full_name').order('full_name')
  if (error) throw toAppError(error, 'No se pudieron cargar los usuarios')
  return data
}
