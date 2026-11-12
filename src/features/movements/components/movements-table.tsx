import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { movementTypeLabels, type Movement } from '../types'

export function MovementsTable({ movements }: { movements: Movement[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead className="hidden sm:table-cell">Tipo</TableHead>
          <TableHead className="text-right">Cantidad</TableHead>
          <TableHead className="hidden md:table-cell">Existencias</TableHead>
          <TableHead className="hidden xl:table-cell">Motivo</TableHead>
          <TableHead className="hidden lg:table-cell">Usuario</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((movement) => (
          <TableRow key={movement.id}>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formatDateTime(movement.created_at)}
            </TableCell>
            <TableCell className="w-full max-w-0">
              <Link to={`/productos/${movement.product_id}`} className="block truncate font-medium hover:underline">
                {movement.product_name}
              </Link>
              <span className="block truncate text-xs text-muted-foreground sm:hidden">
                {movementTypeLabels[movement.type]}
              </span>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Badge variant="outline">{movementTypeLabels[movement.type]}</Badge>
            </TableCell>
            <TableCell
              className={cn(
                'text-right font-medium tabular-nums',
                movement.quantity > 0 && 'text-emerald-700',
              )}
            >
              {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <span className="flex items-center gap-1.5 whitespace-nowrap tabular-nums">
                <span className="text-muted-foreground">{movement.stock_before}</span>
                <ArrowRight className="size-3 text-muted-foreground" aria-label="pasa a" />
                {movement.stock_after}
              </span>
            </TableCell>
            <TableCell className="hidden max-w-56 xl:table-cell">
              {movement.sale_id && movement.type === 'venta' ? (
                <Link to={`/ventas/${movement.sale_id}`} className="hover:underline">
                  Venta N.º {movement.sale_number}
                </Link>
              ) : (
                <span className="block truncate text-muted-foreground" title={movement.reason ?? undefined}>
                  {movement.reason ?? '—'}
                </span>
              )}
            </TableCell>
            <TableCell className="hidden whitespace-nowrap lg:table-cell">{movement.user_name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
