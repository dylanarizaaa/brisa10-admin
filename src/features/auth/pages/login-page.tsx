import { Store } from 'lucide-react'
import { Navigate, useLocation } from 'react-router'
import { FullScreenLoader } from '@/components/shared/full-screen-message'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '../auth-context'
import { LoginForm } from '../components/login-form'

export function LoginPage() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') return <FullScreenLoader />
  if (auth.status !== 'unauthenticated') {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/'} replace />
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-6">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Store className="size-4" />
        </div>
        <span className="text-lg font-semibold">Brisa10</span>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Ingresa con tu cuenta para administrar el negocio.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
