import { toAppError } from '@/lib/errors'
import { getSupabase } from '@/lib/supabase'
import type { CategoryValues } from '../schemas/category-schema'
import type { Category } from '../types'

const duplicateName = { '23505': 'Ya existe una categoría con ese nombre' }

function toRow(values: CategoryValues) {
  return { name: values.name, description: values.description || null }
}

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await getSupabase()
    .from('categories')
    .select('*, products(count)')
    .order('name')
  if (error) throw toAppError(error, 'No se pudieron cargar las categorías')
  return data.map(({ products, ...category }) => ({
    ...category,
    product_count: products[0]?.count ?? 0,
  }))
}

export async function createCategory(values: CategoryValues): Promise<void> {
  const { error } = await getSupabase().from('categories').insert(toRow(values))
  if (error) throw toAppError(error, 'No se pudo crear la categoría', duplicateName)
}

export async function updateCategory(id: string, values: CategoryValues): Promise<void> {
  const { error } = await getSupabase().from('categories').update(toRow(values)).eq('id', id)
  if (error) throw toAppError(error, 'No se pudo guardar la categoría', duplicateName)
}

export async function setCategoryActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await getSupabase().from('categories').update({ is_active: isActive }).eq('id', id)
  if (error) throw toAppError(error, 'No se pudo cambiar el estado de la categoría')
}
