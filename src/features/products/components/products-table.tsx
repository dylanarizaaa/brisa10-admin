import { Eye, MoreHorizontal, Pencil, Power, PowerOff } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCOP } from '@/lib/format'
import type { Product } from '../types'
import { ProductThumbnail } from './product-thumbnail'
import { StockBadge } from './stock-badge'

interface ProductsTableProps {
  products: Product[]
  canEdit: boolean
  onToggleActive: (product: Product) => void
}

export function ProductsTable({ products, canEdit, onToggleActive }: ProductsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead className="hidden lg:table-cell">Categoría</TableHead>
          <TableHead className="text-right">Precio</TableHead>
          <TableHead className="text-right">
            <span className="sm:hidden">Exist.</span>
            <span className="hidden sm:inline">Existencias</span>
          </TableHead>
          <TableHead className="hidden sm:table-cell">Disponibilidad</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id} className={product.is_active ? undefined : 'text-muted-foreground'}>
            {/* w-full + max-w-0: la columna ocupa el espacio libre y el nombre se recorta en vez de desbordar. */}
            <TableCell className="w-full max-w-0">
              <Link to={`/productos/${product.id}`} className="flex items-center gap-3">
                <ProductThumbnail storagePath={product.main_image_path} alt="" />
                <span className="flex min-w-0 flex-col">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium hover:underline">{product.name}</span>
                    {!product.is_active && (
                      <Badge variant="outline" className="shrink-0">
                        Inactivo
                      </Badge>
                    )}
                  </span>
                  {product.sku && <span className="truncate text-xs text-muted-foreground">{product.sku}</span>}
                </span>
              </Link>
            </TableCell>
            <TableCell className="hidden lg:table-cell">{product.category_name}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCOP(product.price)}</TableCell>
            <TableCell className="text-right tabular-nums">{product.stock}</TableCell>
            <TableCell className="hidden sm:table-cell">
              <StockBadge status={product.stock_status} />
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${product.name}`}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/productos/${product.id}`}>
                      <Eye />
                      Ver detalle
                    </Link>
                  </DropdownMenuItem>
                  {canEdit && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={`/productos/${product.id}/editar`}>
                          <Pencil />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onToggleActive(product)}>
                        {product.is_active ? <PowerOff /> : <Power />}
                        {product.is_active ? 'Desactivar' : 'Activar'}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
