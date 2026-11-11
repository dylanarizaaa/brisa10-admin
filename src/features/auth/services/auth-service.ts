import type { AuthError, Session } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'
import type { LoginValues } from '../schemas/login-schema'
import type { Profile } from '../types'

function translateAuthError(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Correo o contraseña incorrectos'
    case 'email_not_confirmed':
      return 'El correo de esta cuenta no ha sido confirmado'
    case 'user_banned':
      return 'Esta cuenta está bloqueada'
    case 'over_request_rate_limit':
      return 'Demasiados intentos. Espera un momento e inténtalo de nuevo'
  }
  if (error.name === 'AuthRetryableFetchError') {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet'
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo'
}

export async function signIn({ email, password }: LoginValues): Promise<void> {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password })
  if (error) throw new Error(translateAuthError(error))
}

export async function signOut(): Promise<void> {
  // scope local: cierra la sesión de este equipo aunque no haya conexión.
  const { error } = await getSupabase().auth.signOut({ scope: 'local' })
  if (error) throw new Error('No se pudo cerrar la sesión')
}

export function onSessionChange(callback: (session: Session | null) => void): () => void {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}

/** Devuelve null si el usuario autenticado no tiene perfil (no debería ocurrir: lo crea un trigger). */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error('No se pudo cargar tu perfil de usuario')
  return data
}
