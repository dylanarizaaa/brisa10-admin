import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

let client: SupabaseClient | null = null

/**
 * Cliente único de Supabase. Solo usa la clave pública (anon);
 * la seguridad real la aplican RLS y las funciones RPC en PostgreSQL.
 * Las vistas no lo importan directamente: lo consumen los servicios de cada feature.
 */
export function getSupabase(): SupabaseClient {
  if (!env) {
    throw new Error('Faltan las variables de entorno de Supabase. Revisa el archivo .env')
  }
  client ??= createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
  return client
}
