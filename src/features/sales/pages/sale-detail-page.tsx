import { ArrowLeft, Ban, Plus, ReceiptText } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState, ErrorState } from '@/components/shared/state-message'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCurrentUser } from '@/features/auth/auth-context'
import { formatCOP, formatDateTime } from '@/lib/format'
import { CancelSaleDialog } from '../components/cancel-sale-dialog'
import { SaleStatusBadge } from '../components/sale-status-badge'
import { useSale } from '../hooks/use-sales'
import { paymentMethodLabels, type SaleDetail } from '../types'

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  )
}

function SaleDetailContent({ sale }: { sale: SaleDetail }) {
  const { isAdmin } = useCurrentUser()
  const [cancelling, setCancelling] = useState(false)
  const cancelled = sale.status === 'anulada'

  return (
    <>
      <PageHeader title={`Venta N.º ${sale.sale_number}`} description={formatDateTime(sale.created_at)}>
        {isAdmin && !cancelled && (
          <Button variant="outline" onClick={() => setCancelling(true)}>
            <Ban />
            Anular venta
          </Button>
        )}
        <Button asChild>
          <Link to="/ventas/nueva">
            <Plus />
            Nueva venta
          </Link>
        </Button>
      </PageHeader>

      <div>
        <SaleStatusBadge status={sale.status} />
      </div>

      {cancelled && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-medium">Venta anulada</p>
          <p className="mt-1 text-muted-foreground">
            {sale.cancelled_at && formatDateTime(sale.cancelled_at)}
            {sale.cancelled_by_name && ` · ${sale.cancelled_by_name}`}
          </p>
          {sale.cancel_reason && <p className="mt-1">Motivo: {sale.cancel_reason}</p>}
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-lg border p-4 sm:grid-cols-3">
        <Detail label="Vendedor">{sale.seller_name}</Detail>
        <Detail label="Método de pago">{paymentMethodLabels[sale.payment_method]}</Detail>
        <Detail label="Notas">{sale.notes ?? '—'}</Detail>
      </dl>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Cant.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sale.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="w-full max-w-0">
                  <Link to={`/productos/${item.product_id}`} className="block truncate font-medium hover:underline">
                    {item.product_name}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatCOP(item.unit_price)}</TableCell>
                <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCOP(item.subtotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="font-medium">
                Total
              </TableCell>
              <TableCell className="text-right text-base font-semibold tabular-nums">
                {formatCOP(sale.total)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <CancelSaleDialog
        open={cancelling}
        onOpenChange={setCancelling}
        saleId={sale.id}
        saleNumber={sale.sale_number}
      />
    </>
  )
}

export function SaleDetailPage() {
  const { id = '' } = useParams()
  const sale = useSale(id)

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Link to="/ventas" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Ventas
      </Link>

      {sale.isPending ? (
        <div className="flex flex-col gap-4" role="status" aria-label="Cargando venta">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : sale.isError ? (
        <div className="rounded-lg border">
          <ErrorState message={sale.error.message} onRetry={() => void sale.refetch()} />
        </div>
      ) : !sale.data ? (
        <div className="rounded-lg border">
          <EmptyState icon={ReceiptText} title="Venta no encontrada" description="Puede que el enlace sea incorrecto.">
            <Button asChild variant="outline" size="sm">
              <Link to="/ventas">Volver a ventas</Link>
            </Button>
          </EmptyState>
        </div>
      ) : (
        <SaleDetailContent sale={sale.data} />
      )}
    </div>
  )
}
