import { TriangleAlert, UserX } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { FullScreenLoader, FullScreenMessage } from '@/components/shared/full-screen-message'
import { Button } from '@/components/ui/button'
import { useAuth } from '../auth-context'
import { useSignOut } from '../hooks/use-auth-actions'

/** Protege las rutas hijas: exige sesión y un perfil activo. */
export function RequireAuth() {
  const auth = useAuth()
  const location = useLocation()
  const signOut = useSignOut()

  switch (auth.status) {
    case 'loading':
      return <FullScreenLoader />
    case 'unauthenticated':
      return <Navigate to="/login" replace state={{ from: location.pathname }} />
    case 'inactive':
      return (
        <FullScreenMessage
          icon={UserX}
          title="Cuenta desactivada"
          description="Tu cuenta fue desactivada. Contacta al administrador del negocio para recuperar el acceso."
        >
          <Button variant="outline" onClick={() => signOut.mutate()}>
            Cerrar sesión
          </Button>
        </FullScreenMessage>
      )
    case 'error':
      return (
        <FullScreenMessage icon={TriangleAlert} title="No se pudo cargar tu cuenta" description={auth.message}>
          <Button onClick={auth.retry}>Reintentar</Button>
          <Button variant="outline" onClick={() => signOut.mutate()}>
            Cerrar sesión
          </Button>
        </FullScreenMessage>
      )
    case 'authenticated':
      return <Outlet />
  }
}
