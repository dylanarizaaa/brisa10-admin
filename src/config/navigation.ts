import {
  ArrowLeftRight,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  path: string
  icon: LucideIcon
}

export const navigation: NavItem[] = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard },
  { title: 'Ventas', path: '/ventas', icon: ShoppingCart },
  { title: 'Productos', path: '/productos', icon: Package },
  { title: 'Categorías', path: '/categorias', icon: Tags },
  { title: 'Inventario', path: '/inventario', icon: Warehouse },
  { title: 'Movimientos', path: '/movimientos', icon: ArrowLeftRight },
  { title: 'Configuración', path: '/configuracion', icon: Settings },
]
