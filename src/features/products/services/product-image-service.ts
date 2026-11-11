import { toAppError } from '@/lib/errors'
import { getSupabase } from '@/lib/supabase'
import type { ProductImage } from '../types'

const BUCKET = 'product-images'

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** Devuelve el motivo por el que el archivo no se puede subir, o null si es válido. */
export function validateImageFile(file: File): string | null {
  if (!(file.type in IMAGE_TYPES)) return `"${file.name}" no es una imagen JPG, PNG o WebP`
  if (file.size > IMAGE_MAX_BYTES) return `"${file.name}" supera el tamaño máximo de 5 MB`
  return null
}

export function getImageUrl(storagePath: string): string {
  return getSupabase().storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl
}

export async function uploadProductImage(productId: string, file: File, position: number): Promise<void> {
  const invalid = validateImageFile(file)
  if (invalid) throw new Error(invalid)

  const supabase = getSupabase()
  const path = `${productId}/${crypto.randomUUID()}.${IMAGE_TYPES[file.type]}`

  const upload = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: '31536000' })
  if (upload.error) throw new Error(`No se pudo subir "${file.name}"`)

  const { error } = await supabase
    .from('product_images')
    .insert({ product_id: productId, storage_path: path, position })
  if (error) {
    // Sin registro en la base de datos el archivo quedaría huérfano: se retira.
    await supabase.storage.from(BUCKET).remove([path])
    throw toAppError(error, `No se pudo registrar "${file.name}"`)
  }
}

export async function deleteProductImage(image: ProductImage): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('product_images').delete().eq('id', image.id)
  if (error) throw toAppError(error, 'No se pudo eliminar la fotografía')
  // Si falla el borrado del archivo, la foto ya no aparece en el producto; solo queda espacio sin liberar.
  await supabase.storage.from(BUCKET).remove([image.storage_path])
}

/** Guarda el orden de las fotos; la primera es la principal. */
export async function reorderProductImages(orderedIds: string[]): Promise<void> {
  const supabase = getSupabase()
  const results = await Promise.all(
    orderedIds.map((id, position) => supabase.from('product_images').update({ position }).eq('id', id)),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) throw toAppError(failed.error, 'No se pudo cambiar el orden de las fotografías')
}
