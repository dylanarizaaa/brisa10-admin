import { History } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/shared/state-message'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useRecentMovements } from '../hooks/use-dashboard'
import { movementTypeLabels } from '../types'

export function RecentActivity() {
  const movements = useRecentMovements()

  return (
    <section className="flex flex-col rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="font-medium">Actividad reciente</h2>
        <p className="text-sm text-muted-foreground">Últimos movimientos de inventario.</p>
      </div>

      {movements.isPending ? (
        <div className="flex flex-col gap-3 p-4" role="status" aria-label="Cargando actividad">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      ) : movements.isError ? (
        <ErrorState message={movements.error.message} onRetry={() => void movements.refetch()} />
      ) : movements.data.length === 0 ? (
        <EmptyState
          icon={History}
          title="Sin actividad todavía"
          description="Aquí aparecerán las entradas, salidas y ventas a medida que se registren."
        />
      ) : (
        <ul className="divide-y">
          {movements.data.map((movement) => (
            <li key={movement.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{movement.product_name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {movementTypeLabels[movement.type]} · {movement.user_name} · {formatDateTime(movement.created_at)}
                </span>
              </div>
              <span
                className={cn(
                  'shrink-0 text-sm font-medium tabular-nums',
                  movement.quantity > 0 ? 'text-emerald-600' : 'text-foreground',
                )}
              >
                {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
