import { Trophy } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState, ErrorState } from '@/components/shared/state-message'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCOP } from '@/lib/format'
import { TOP_PRODUCTS_DAYS, useTopProducts } from '../hooks/use-dashboard'

export function TopProducts() {
  const top = useTopProducts()

  return (
    <section className="flex min-w-0 flex-col rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="font-medium">Productos más vendidos</h2>
        <p className="text-sm text-muted-foreground">Últimos {TOP_PRODUCTS_DAYS} días.</p>
      </div>

      {top.isPending ? (
        <div className="flex flex-col gap-3 p-4" role="status" aria-label="Cargando productos más vendidos">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      ) : top.isError ? (
        <ErrorState message={top.error.message} onRetry={() => void top.refetch()} />
      ) : top.data.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Sin ventas en el periodo"
          description="Aquí aparecerán los productos que más se vendan."
        />
      ) : (
        <ol className="divide-y">
          {top.data.map((product, index) => (
            <li key={product.product_id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-5 shrink-0 text-sm text-muted-foreground tabular-nums">{index + 1}</span>
              <Link
                to={`/productos/${product.product_id}`}
                className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
              >
                {product.product_name}
              </Link>
              <span className="shrink-0 text-right text-sm tabular-nums">
                <span className="font-medium">{product.units}</span>
                <span className="text-muted-foreground"> {product.units === 1 ? 'unidad' : 'unidades'}</span>
                <span className="block text-xs text-muted-foreground">{formatCOP(product.revenue)}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
