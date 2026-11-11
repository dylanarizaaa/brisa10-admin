import type { Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthState } from './auth-context'
import { getProfile, onSessionChange } from './services/auth-service'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  // undefined = todavía no se sabe si hay una sesión guardada.
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const userId = session?.user.id

  useEffect(() => {
    return onSessionChange((next) => {
      setSession(next)
      // Al cerrar sesión se descartan los datos en caché del usuario anterior.
      if (!next) queryClient.clear()
    })
  }, [queryClient])

  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  })

  const { data: profile, isPending, error, refetch } = profileQuery

  const value = useMemo<AuthState>(() => {
    if (session === undefined) return { status: 'loading' }
    if (session === null) return { status: 'unauthenticated' }
    if (isPending) return { status: 'loading' }
    if (error || !profile) {
      return {
        status: 'error',
        session,
        message: error?.message ?? 'Tu usuario no tiene un perfil asignado. Contacta al administrador',
        retry: () => void refetch(),
      }
    }
    return { status: profile.is_active ? 'authenticated' : 'inactive', session, profile }
  }, [session, profile, isPending, error, refetch])

  return <AuthContext value={value}>{children}</AuthContext>
}
