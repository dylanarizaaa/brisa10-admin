import { ArrowDownToLine, ArrowUpFromLine, MoreHorizontal, SlidersHorizontal } from 'lucide-react'
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
import { ProductThumbnail } from '@/features/products/components/product-thumbnail'
import { StockBadge } from '@/features/products/components/stock-badge'
import type { Product } from '@/features/products/types'
import type { MovementMode } from '../types'

interface InventoryTableProps {
  products: Product[]
  /** Solo el administrador puede hacer ajustes manuales. */
  canAdjust: boolean
  onOperation: (mode: MovementMode, product: Product) => void
}

export function InventoryTable({ products, canAdjust, onOperation }: InventoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead className="hidden lg:table-cell">Categoría</TableHead>
          <TableHead className="text-right">
            <span className="sm:hidden">Exist.</span>
            <span className="hidden sm:inline">Existencias</span>
          </TableHead>
          <TableHead className="hidden text-right md:table-cell">Mínimo</TableHead>
          <TableHead className="hidden sm:table-cell">Disponibilidad</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id} className={product.is_active ? undefined : 'text-muted-foreground'}>
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
            <TableCell className="text-right font-medium tabular-nums">{product.stock}</TableCell>
            <TableCell className="hidden text-right text-muted-foreground tabular-nums md:table-cell">
              {product.effective_min_stock}
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <StockBadge status={product.stock_status} />
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Movimientos de ${product.name}`}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onOperation('entrada', product)}>
                    <ArrowDownToLine />
                    Registrar entrada
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={product.stock === 0} onSelect={() => onOperation('salida', product)}>
                    <ArrowUpFromLine />
                    Registrar salida
                  </DropdownMenuItem>
                  {canAdjust && (
                    <DropdownMenuItem onSelect={() => onOperation('ajuste', product)}>
                      <SlidersHorizontal />
                      Ajustar existencias
                    </DropdownMenuItem>
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
