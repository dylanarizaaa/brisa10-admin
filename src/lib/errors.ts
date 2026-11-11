import type { PostgrestError } from '@supabase/supabase-js'

/** Mensajes específicos por código de error de PostgreSQL / PostgREST. */
type ErrorMessages = Partial<Record<string, string>>

const defaultMessages: Record<string, string> = {
  '42501': 'No tienes permiso para realizar esta acción',
  PGRST202: 'Falta aplicar una migración en Supabase. Revisa la tabla de migraciones del README',
  '23503': 'La operación hace referencia a un registro que no existe o que está en uso',
  '23514': 'Los datos no cumplen las reglas de validación',
  PGRST301: 'Tu sesión expiró. Vuelve a iniciar sesión',
}

/**
 * Convierte un error de Supabase en un Error con mensaje en español apto para mostrar al usuario.
 * `messages` permite a cada servicio dar un mensaje propio (p. ej. nombre duplicado).
 */
export function toAppError(error: PostgrestError, fallback: string, messages: ErrorMessages = {}): Error {
  // P0001: error de regla de negocio lanzado por nuestras funciones SQL, ya redactado en español.
  if (error.code === 'P0001' && error.message) return new Error(error.message)
  const message = messages[error.code] ?? defaultMessages[error.code]
  if (message) return new Error(message)
  // Sin código: fallo de red (fetch no llegó al servidor).
  if (!error.code) return new Error('No se pudo conectar con el servidor. Revisa tu conexión a internet')
  return new Error(fallback)
}
