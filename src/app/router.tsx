import { createBrowserRouter } from 'react-router'
import { ModulePlaceholder } from '@/components/shared/module-placeholder'
import { navigation } from '@/config/navigation'
import { AppLayout } from './layouts/app-layout'

// Cada feature reemplazará su placeholder por su página real al implementarse.
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: navigation.map((item) => ({
      path: item.path,
      element: <ModulePlaceholder title={item.title} phase={item.phase} />,
    })),
  },
])
