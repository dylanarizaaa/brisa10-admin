import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
})

const parsed = envSchema.safeParse(import.meta.env)

/**
 * Variables de entorno validadas. Es `null` cuando faltan o son inválidas,
 * para que la app pueda mostrar una pantalla de configuración en lugar de fallar al importar.
 */
export const env = parsed.success ? parsed.data : null
