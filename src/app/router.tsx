import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { ModulePlaceholder } from '@/components/shared/module-placeholder'
import { navigation } from '@/config/navigation'
import { RequireAuth } from '@/features/auth/components/require-auth'
import { LoginPage } from '@/features/auth/pages/login-page'
import { CategoriesPage } from '@/features/categories/pages/categories-page'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { AppLayout } from './layouts/app-layout'

/** Páginas ya implementadas; el resto de la navegación muestra un placeholder. */
const pages: Record<string, ReactNode> = {
  '/': <DashboardPage />,
  '/categorias': <CategoriesPage />,
}

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
            element: pages[item.path] ?? <ModulePlaceholder title={item.title} phase={item.phase} />,
          })),
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
])
