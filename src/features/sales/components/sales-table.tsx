import { Link } from 'react-router'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCOP, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { paymentMethodLabels, type Sale } from '../types'
import { SaleStatusBadge } from './sale-status-badge'

export function SalesTable({ sales }: { sales: Sale[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Venta</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead className="hidden lg:table-cell">Vendedor</TableHead>
          <TableHead className="hidden md:table-cell">Pago</TableHead>
          <TableHead className="hidden sm:table-cell">Estado</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => (
          <TableRow key={sale.id}>
            <TableCell>
              <Link to={`/ventas/${sale.id}`} className="font-medium hover:underline">
                N.º {sale.sale_number}
              </Link>
              <div className="mt-1 sm:hidden">
                <SaleStatusBadge status={sale.status} />
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDateTime(sale.created_at)}</TableCell>
            <TableCell className="hidden lg:table-cell">{sale.seller_name}</TableCell>
            <TableCell className="hidden md:table-cell">{paymentMethodLabels[sale.payment_method]}</TableCell>
            <TableCell className="hidden sm:table-cell">
              <SaleStatusBadge status={sale.status} />
            </TableCell>
            <TableCell
              className={cn(
                'text-right font-medium tabular-nums',
                sale.status === 'anulada' && 'text-muted-foreground line-through',
              )}
            >
              {formatCOP(sale.total)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
