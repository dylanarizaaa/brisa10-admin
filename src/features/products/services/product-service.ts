import { toAppError } from '@/lib/errors'
import { getSupabase } from '@/lib/supabase'
import { normalizeText } from '@/lib/text'
import type { ProductValues } from '../schemas/product-schema'
import { PRODUCTS_PAGE_SIZE, type ProductDetail, type ProductFilters, type ProductPage } from '../types'

const saveMessages = {
  '23505': 'Ya existe un producto con ese código (SKU)',
  '23503': 'La categoría seleccionada ya no existe',
}

const missingViewMessages = {
  PGRST205: 'Falta aplicar la migración de productos en Supabase (20261111000003_product_list.sql)',
}

function toRow(values: ProductValues) {
  return {
    name: values.name,
    sku: values.sku || null,
    description: values.description || null,
    category_id: values.categoryId,
    price: Number(values.price),
    min_stock: values.minStock === '' ? null : Number(values.minStock),
  }
}

/** Patrón para ilike: escapa los comodines que el usuario haya escrito. */
function toLikePattern(search: string): string {
  return `%${normalizeText(search.trim()).replace(/[\\%_]/g, '\\$&')}%`
}

export async function listProducts(filters: ProductFilters): Promise<ProductPage> {
  let query = getSupabase().from('product_list').select('*', { count: 'exact' })

  if (filters.search.trim()) query = query.ilike('search_text', toLikePattern(filters.search))
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters.active !== 'all') query = query.eq('is_active', filters.active === 'active')
  if (filters.availability === 'in_stock') query = query.gt('stock', 0)
  if (filters.availability === 'low') query = query.eq('stock_status', 'bajo')
  if (filters.availability === 'out') query = query.eq('stock', 0)

  const from = (filters.page - 1) * PRODUCTS_PAGE_SIZE
  const { data, error, count } = await query
    .order('name')
    .order('id')
    .range(from, from + PRODUCTS_PAGE_SIZE - 1)

  if (error) {
    // Página fuera de rango (p. ej. tras filtrar): se trata como página vacía.
    if (error.code === 'PGRST103') return { items: [], total: 0 }
    throw toAppError(error, 'No se pudieron cargar los productos', missingViewMessages)
  }
  return { items: data, total: count ?? 0 }
}

/** Devuelve null si el producto no existe. El costo solo se consulta para administradores. */
export async function getProduct(id: string, includeCost: boolean): Promise<ProductDetail | null> {
  const supabase = getSupabase()
  const [product, images, cost] = await Promise.all([
    supabase.from('product_list').select('*').eq('id', id).maybeSingle(),
    supabase.from('product_images').select('*').eq('product_id', id).order('position').order('created_at'),
    includeCost ? supabase.from('product_costs').select('cost').eq('product_id', id).maybeSingle() : null,
  ])

  // 22P02: el id de la URL no es un UUID válido → producto inexistente.
  if (product.error?.code === '22P02') return null
  const error = product.error ?? images.error ?? cost?.error
  if (error) throw toAppError(error, 'No se pudo cargar el producto', missingViewMessages)
  if (!product.data) return null

  return { ...product.data, images: images.data ?? [], cost: cost?.data?.cost ?? null }
}

async function saveCost(productId: string, cost: string): Promise<void> {
  const supabase = getSupabase()
  const { error } =
    cost === ''
      ? await supabase.from('product_costs').delete().eq('product_id', productId)
      : await supabase.from('product_costs').upsert({ product_id: productId, cost: Number(cost) })
  if (error) throw new Error('El producto se guardó, pero no se pudo guardar el costo. Edítalo e inténtalo de nuevo')
}

/** Crea el producto y devuelve su id. Las existencias empiezan en 0: se registran desde Inventario. */
export async function createProduct(values: ProductValues): Promise<string> {
  const { data, error } = await getSupabase().from('products').insert(toRow(values)).select('id').single()
  if (error) throw toAppError(error, 'No se pudo crear el producto', saveMessages)
  if (values.cost !== '') await saveCost(data.id, values.cost)
  return data.id
}

export async function updateProduct(id: string, values: ProductValues): Promise<void> {
  const { error } = await getSupabase().from('products').update(toRow(values)).eq('id', id)
  if (error) throw toAppError(error, 'No se pudo guardar el producto', saveMessages)
  await saveCost(id, values.cost)
}

export async function setProductActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await getSupabase().from('products').update({ is_active: isActive }).eq('id', id)
  if (error) throw toAppError(error, 'No se pudo cambiar el estado del producto')
}
