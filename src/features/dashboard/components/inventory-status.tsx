import { CircleCheck, CircleSlash, Package, TriangleAlert, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/shared/state-message'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardSummary } from '../types'
import { chartVars } from './chart-tokens'

interface Segment {
  label: string
  count: number
  color: string
  icon: LucideIcon
  /** Filtro de la pantalla de inventario que muestra estos productos. */
  filter: string
}

/** Composición del inventario activo: una barra partida en tres estados. */
export function InventoryStatus({ summary }: { summary: DashboardSummary | undefined }) {
  const segments: Segment[] = summary
    ? [
        {
          label: 'Con existencias suficientes',
          count: Math.max(0, summary.available_products - summary.low_stock_products),
          color: 'var(--chart-good)',
          icon: CircleCheck,
          filter: 'in_stock',
        },
        {
          label: 'Bajo inventario',
          count: summary.low_stock_products,
          color: 'var(--chart-warning)',
          icon: TriangleAlert,
          filter: 'low',
        },
        {
          label: 'Agotados',
          count: summary.out_of_stock_products,
          color: 'var(--chart-critical)',
          icon: CircleSlash,
          filter: 'out',
        },
      ]
    : []
  const total = segments.reduce((sum, segment) => sum + segment.count, 0)
  const share = (count: number) => `${Math.round((count / total) * 100)} %`

  return (
    <section className="flex min-w-0 flex-col rounded-lg border bg-card" style={chartVars}>
      <div className="border-b px-4 py-3">
        <h2 className="font-medium">Estado del inventario</h2>
        <p className="text-sm text-muted-foreground">
          {summary ? `${total} ${total === 1 ? 'producto activo' : 'productos activos'}` : 'Productos activos'}
        </p>
      </div>

      {!summary ? (
        <div className="flex flex-col gap-3 p-4" role="status" aria-label="Cargando estado del inventario">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : total === 0 ? (
        <EmptyState icon={Package} title="Sin productos activos" />
      ) : (
        <div className="flex flex-col gap-4 p-4">
          <div
            className="flex h-2 gap-0.5 overflow-hidden rounded-full"
            role="img"
            aria-label={segments.map((segment) => `${segment.label}: ${segment.count} (${share(segment.count)})`).join(', ')}
          >
            {segments
              .filter((segment) => segment.count > 0)
              .map((segment) => (
                <span
                  key={segment.label}
                  title={`${segment.label}: ${segment.count} (${share(segment.count)})`}
                  style={{ flexGrow: segment.count, backgroundColor: segment.color }}
                />
              ))}
          </div>

          <ul className="flex flex-col">
            {segments.map((segment) => (
              <li key={segment.label}>
                <Link
                  to={`/inventario?existencias=${segment.filter}`}
                  className="-mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <segment.icon className="size-4 shrink-0" style={{ color: segment.color }} />
                  <span className="min-w-0 flex-1 truncate">{segment.label}</span>
                  <span className="font-medium tabular-nums">{segment.count}</span>
                  <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                    {share(segment.count)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
