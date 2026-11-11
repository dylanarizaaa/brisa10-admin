import { isDateString, startOfDay, startOfNextDay } from '@/lib/dates'
import { toAppError } from '@/lib/errors'
import { getSupabase } from '@/lib/supabase'
import type { PaymentMethod } from '@/types/database'
import { SALES_PAGE_SIZE, type SaleDetail, type SaleFilters, type SalePage } from '../types'

export async function listSales(filters: SaleFilters): Promise<SalePage> {
  let query = getSupabase()
    .from('sales')
    .select('*, seller:profiles!sales_created_by_fkey(full_name)', { count: 'exact' })

  if (filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters.payment !== 'all') query = query.eq('payment_method', filters.payment)
  if (isDateString(filters.from)) query = query.gte('created_at', startOfDay(filters.from))
  if (isDateString(filters.to)) query = query.lt('created_at', startOfNextDay(filters.to))

  const from = (filters.page - 1) * SALES_PAGE_SIZE
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + SALES_PAGE_SIZE - 1)

  if (error) {
    if (error.code === 'PGRST103') return { items: [], total: 0 }
    throw toAppError(error, 'No se pudieron cargar las ventas')
  }
  return {
    items: data.map(({ seller, ...sale }) => ({ ...sale, seller_name: seller.full_name })),
    total: count ?? 0,
  }
}

/** Devuelve null si la venta no existe. */
export async function getSale(id: string): Promise<SaleDetail | null> {
  const { data, error } = await getSupabase()
    .from('sales')
    .select(
      '*, seller:profiles!sales_created_by_fkey(full_name), canceller:profiles!sales_cancelled_by_fkey(full_name), sale_items(*)',
    )
    .eq('id', id)
    .order('product_name', { referencedTable: 'sale_items' })
    .maybeSingle()

  // 22P02: el id de la URL no es un UUID válido → venta inexistente.
  if (error?.code === '22P02') return null
  if (error) throw toAppError(error, 'No se pudo cargar la venta')
  if (!data) return null

  const { seller, canceller, sale_items, ...sale } = data
  return {
    ...sale,
    items: sale_items,
    seller_name: seller.full_name,
    cancelled_by_name: canceller?.full_name ?? null,
  }
}

export interface CreateSaleInput {
  items: { productId: string; quantity: number }[]
  paymentMethod: PaymentMethod
  notes: string
}

/**
 * Registra la venta mediante la función RPC: valida existencias, toma los precios de la base
 * de datos, descuenta inventario y registra los movimientos en una sola transacción.
 * Devuelve el id de la venta creada.
 */
export async function createSale(input: CreateSaleInput): Promise<{ id: string; saleNumber: number }> {
  const { data, error } = await getSupabase().rpc('create_sale', {
    p_items: input.items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
    p_payment_method: input.paymentMethod,
    p_notes: input.notes.trim() || undefined,
  })
  if (error) throw toAppError(error, 'No se pudo registrar la venta')
  return { id: data.id, saleNumber: data.sale_number }
}

export async function cancelSale(id: string, reason: string): Promise<void> {
  const { error } = await getSupabase().rpc('cancel_sale', { p_sale_id: id, p_reason: reason.trim() })
  if (error) throw toAppError(error, 'No se pudo anular la venta')
}
