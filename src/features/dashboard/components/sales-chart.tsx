import { ChartColumn, Table2 } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, ErrorState } from '@/components/shared/state-message'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCOP } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { SalesByDay } from '@/types/database'
import { SALES_CHART_DAYS, useSalesByDay } from '../hooks/use-dashboard'
import { chartVars } from './chart-tokens'

const compactCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const monthShort = new Intl.DateTimeFormat('es-CO', { month: 'short' })
/** "11 nov": más corto que el formato regional ("11 de nov"), para que quepa bajo las barras. */
const shortDay = { format: (date: Date) => `${date.getDate()} ${monthShort.format(date).replace('.', '')}` }
const longDay = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

/** El día llega como AAAA-MM-DD; al mediodía local se evita que la zona horaria lo corra. */
const toDate = (day: string) => new Date(`${day}T12:00:00`)

const NICE_STEPS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]

/** Redondea hacia arriba a un número limpio (1,2 · 1,5 · 2 · 2,5 · 3 · 4 · 5 · 6 · 8 × 10ⁿ) para el tope del eje. */
function niceMax(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = NICE_STEPS.find((candidate) => candidate * magnitude >= value) ?? 10
  return step * magnitude
}

function salesLabel(count: number): string {
  return `${count} ${count === 1 ? 'venta' : 'ventas'}`
}

function Columns({ data }: { data: SalesByDay[] }) {
  const [active, setActive] = useState<number | null>(null)
  const max = niceMax(Math.max(...data.map((day) => day.revenue)))
  const hovered = active === null ? null : data[active]
  // Una etiqueta de fecha cada pocos días para que no se monten.
  const labelEvery = Math.ceil(data.length / 7)

  return (
    <div className="flex gap-3">
      {/* Eje Y: tres marcas discretas. */}
      <div className="flex h-44 flex-col justify-between text-right text-xs text-muted-foreground tabular-nums" aria-hidden>
        <span className="-translate-y-1/2">{compactCOP.format(max)}</span>
        <span>{compactCOP.format(max / 2)}</span>
        <span className="translate-y-1/2">0</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative h-44" onPointerLeave={() => setActive(null)}>
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden>
            <div className="border-t border-dashed" />
            <div className="border-t border-dashed" />
            <div className="border-t" />
          </div>

          <ul className="absolute inset-0 flex" aria-label="Ingresos por día">
            {data.map((day, index) => (
              <li key={day.day} className="flex min-w-0 flex-1">
                {/* Toda la franja del día responde al puntero, no solo la barra. */}
                <button
                  type="button"
                  className="group flex flex-1 items-end justify-center px-px outline-none"
                  aria-label={`${longDay.format(toDate(day.day))}: ${formatCOP(day.revenue)}, ${salesLabel(day.sales_count)}`}
                  onPointerEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                >
                  <span
                    className={cn(
                      'w-full max-w-6 rounded-t-[4px] bg-(--chart-series) transition-opacity group-focus-visible:ring-2 group-focus-visible:ring-ring',
                      active !== null && active !== index && 'opacity-50',
                    )}
                    // Un día con ventas siempre deja ver al menos una línea.
                    style={{ height: day.revenue > 0 ? `max(${(day.revenue / max) * 100}%, 2px)` : 0 }}
                  />
                </button>
              </li>
            ))}
          </ul>

          {hovered && active !== null && (
            <div
              role="status"
              className="pointer-events-none absolute top-0 z-10 rounded-md border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap shadow-sm"
              style={{
                left: `${((active + 0.5) / data.length) * 100}%`,
                // Cerca de los bordes el recuadro se alinea hacia dentro para no salirse.
                transform: `translateX(${active < 2 ? '0' : active > data.length - 3 ? '-100%' : '-50%'})`,
              }}
            >
              <p className="text-sm font-semibold tabular-nums">{formatCOP(hovered.revenue)}</p>
              <p className="text-muted-foreground">
                {shortDay.format(toDate(hovered.day))} · {salesLabel(hovered.sales_count)}
              </p>
            </div>
          )}
        </div>

        <ul className="mt-1.5 flex text-xs text-muted-foreground" aria-hidden>
          {data.map((day, index) => (
            <li key={day.day} className="min-w-0 flex-1 text-center whitespace-nowrap">
{(data.length - 1 - index) % labelEvery === 0 && (
                // En pantallas angostas se muestra una etiqueta de cada dos para que no se monten.
                <span className={cn((data.length - 1 - index) % (labelEvery * 2) !== 0 && 'hidden sm:inline')}>
                  {shortDay.format(toDate(day.day))}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function DataTable({ data }: { data: SalesByDay[] }) {
  return (
    <div className="max-h-52 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
          <tr>
            <th className="py-1.5 font-normal">Día</th>
            <th className="py-1.5 text-right font-normal">Ventas</th>
            <th className="py-1.5 text-right font-normal">Ingresos</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {[...data].reverse().map((day) => (
            <tr key={day.day}>
              <td className="py-1.5">{shortDay.format(toDate(day.day))}</td>
              <td className="py-1.5 text-right tabular-nums">{day.sales_count}</td>
              <td className="py-1.5 text-right tabular-nums">{formatCOP(day.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SalesChart() {
  const sales = useSalesByDay()
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const data = sales.data ?? []
  const totalRevenue = data.reduce((sum, day) => sum + day.revenue, 0)
  const totalSales = data.reduce((sum, day) => sum + day.sales_count, 0)

  return (
    <section className="flex min-w-0 flex-col rounded-lg border bg-card" style={chartVars}>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 border-b px-4 py-3">
        <div>
          <h2 className="font-medium">Ingresos por día</h2>
          <p className="text-sm text-muted-foreground">
            Últimos {SALES_CHART_DAYS} días
            {sales.data && totalSales > 0 && ` · ${formatCOP(totalRevenue)} en ${salesLabel(totalSales)}`}
          </p>
        </div>
        {totalSales > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView((current) => (current === 'chart' ? 'table' : 'chart'))}
          >
            {view === 'chart' ? <Table2 /> : <ChartColumn />}
            {view === 'chart' ? 'Ver tabla' : 'Ver gráfico'}
          </Button>
        )}
      </div>

      {sales.isPending ? (
        <div className="p-4" role="status" aria-label="Cargando ventas por día">
          <Skeleton className="h-48 w-full" />
        </div>
      ) : sales.isError ? (
        <ErrorState message={sales.error.message} onRetry={() => void sales.refetch()} />
      ) : totalSales === 0 ? (
        <EmptyState
          icon={ChartColumn}
          title="Sin ventas en el periodo"
          description="Cuando registres ventas verás aquí los ingresos de cada día."
        />
      ) : (
        <div className="px-4 pt-5 pb-4">{view === 'chart' ? <Columns data={data} /> : <DataTable data={data} />}</div>
      )}
    </section>
  )
}
