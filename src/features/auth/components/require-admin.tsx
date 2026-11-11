import { Navigate, Outlet } from 'react-router'
import { useCurrentUser } from '../auth-context'

/** Protege rutas exclusivas del administrador. La restricción real la aplica RLS. */
export function RequireAdmin({ redirectTo }: { redirectTo: string }) {
  const { isAdmin } = useCurrentUser()
  return isAdmin ? <Outlet /> : <Navigate to={redirectTo} replace />
}
