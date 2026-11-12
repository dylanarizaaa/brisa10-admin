import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { RequireAuth } from '@/features/auth/components/require-auth'
import { LoginPage } from '@/features/auth/pages/login-page'
import { CategoriesPage } from '@/features/categories/pages/categories-page'
import { RequireAdmin } from '@/features/auth/components/require-admin'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { InventoryPage } from '@/features/inventory/pages/inventory-page'
import { MovementsPage } from '@/features/movements/pages/movements-page'
import { ProductDetailPage } from '@/features/products/pages/product-detail-page'
import { ProductCreatePage, ProductEditPage } from '@/features/products/pages/product-form-page'
import { ProductsPage } from '@/features/products/pages/products-page'
import { NewSalePage } from '@/features/sales/pages/new-sale-page'
import { SaleDetailPage } from '@/features/sales/pages/sale-detail-page'
import { SalesPage } from '@/features/sales/pages/sales-page'
import { SettingsPage } from '@/features/settings/pages/settings-page'
import { AppLayout } from './layouts/app-layout'
import { RouteError } from './route-error'

/** Página principal de cada módulo de la navegación. */
const pages: Record<string, ReactNode> = {
  '/': <DashboardPage />,
  '/categorias': <CategoriesPage />,
  '/productos': <ProductsPage />,
  '/inventario': <InventoryPage />,
  '/ventas': <SalesPage />,
  '/movimientos': <MovementsPage />,
  '/configuracion': <SettingsPage />,
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          ...Object.entries(pages).map(([path, element]) => ({ path, element })),
          {
            element: <RequireAdmin redirectTo="/productos" />,
            children: [
              { path: '/productos/nuevo', element: <ProductCreatePage /> },
              { path: '/productos/:id/editar', element: <ProductEditPage /> },
            ],
          },
          { path: '/productos/:id', element: <ProductDetailPage /> },
          { path: '/ventas/nueva', element: <NewSalePage /> },
          { path: '/ventas/:id', element: <SaleDetailPage /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
])
