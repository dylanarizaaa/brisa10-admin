import type { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'
import type { Profile } from './types'

export type AuthState =
  /** Resolviendo la sesión guardada o cargando el perfil. */
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  /** Hay sesión pero no se pudo cargar el perfil (red, perfil inexistente). */
  | { status: 'error'; session: Session; message: string; retry: () => void }
  /** Hay sesión, pero un administrador desactivó la cuenta. */
  | { status: 'inactive'; session: Session; profile: Profile }
  | { status: 'authenticated'; session: Session; profile: Profile }

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return value
}

/** Perfil del usuario actual. Solo para componentes renderizados dentro de <RequireAuth>. */
export function useCurrentUser(): Profile & { isAdmin: boolean; email: string } {
  const auth = useAuth()
  if (auth.status !== 'authenticated') {
    throw new Error('useCurrentUser requiere un usuario autenticado')
  }
  return {
    ...auth.profile,
    isAdmin: auth.profile.role === 'admin',
    email: auth.session.user.email ?? '',
  }
}
