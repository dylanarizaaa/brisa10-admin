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
  /** Fase del plan en la que se implementa el módulo. */
  phase: number
}

export const navigation: NavItem[] = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard, phase: 2 },
  { title: 'Ventas', path: '/ventas', icon: ShoppingCart, phase: 5 },
  { title: 'Productos', path: '/productos', icon: Package, phase: 3 },
  { title: 'Categorías', path: '/categorias', icon: Tags, phase: 2 },
  { title: 'Inventario', path: '/inventario', icon: Warehouse, phase: 4 },
  { title: 'Movimientos', path: '/movimientos', icon: ArrowLeftRight, phase: 6 },
  { title: 'Configuración', path: '/configuracion', icon: Settings, phase: 6 },
]
