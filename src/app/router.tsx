import { createBrowserRouter, Navigate } from 'react-router'
import { ModulePlaceholder } from '@/components/shared/module-placeholder'
import { navigation } from '@/config/navigation'
import { RequireAuth } from '@/features/auth/components/require-auth'
import { LoginPage } from '@/features/auth/pages/login-page'
import { AppLayout } from './layouts/app-layout'

// Cada feature reemplazará su placeholder por su página real al implementarse.
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          ...navigation.map((item) => ({
            path: item.path,
            element: <ModulePlaceholder title={item.title} phase={item.phase} />,
          })),
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
])
