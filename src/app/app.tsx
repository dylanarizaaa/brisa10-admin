import { Settings } from 'lucide-react'
import { RouterProvider } from 'react-router'
import { FullScreenMessage } from '@/components/shared/full-screen-message'
import { env } from '@/config/env'
import { AppProviders } from './providers'
import { router } from './router'

export function App() {
  if (!env) {
    return (
      <FullScreenMessage
        icon={Settings}
        title="Falta configurar la conexión"
        description="Crea el archivo .env a partir de .env.example con la URL y la clave anon de tu proyecto de Supabase, y reinicia la aplicación."
      />
    )
  }

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
