import { History, Search } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState, ErrorState } from '@/components/shared/state-message'
import { TablePagination } from '@/components/shared/table-pagination'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { MovementFiltersBar } from '../components/movement-filters-bar'
import { MovementsTable } from '../components/movements-table'
import { useMovementFilters, useMovements } from '../hooks/use-movements'
import { MOVEMENTS_PAGE_SIZE } from '../types'

export function MovementsPage() {
  const { filters, setParam, hasFilters } = useMovementFilters()
  const movements = useMovements(filters)

  const total = movements.data?.total ?? 0
  const items = movements.data?.items ?? []
  const pageCount = Math.max(1, Math.ceil(total / MOVEMENTS_PAGE_SIZE))
  const from = (filters.page - 1) * MOVEMENTS_PAGE_SIZE

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Movimientos"
        description="Historial de entradas, salidas, ventas, ajustes y anulaciones. Los registros no se pueden modificar."
      />

      <MovementFiltersBar filters={filters} setParam={setParam} />

      <div className="overflow-hidden rounded-lg border">
        {movements.isPending ? (
          <div className="flex flex-col gap-3 p-4" role="status" aria-label="Cargando movimientos">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : movements.isError ? (
          <ErrorState message={movements.error.message} onRetry={() => void movements.refetch()} />
        ) : items.length === 0 && filters.page > 1 ? (
          <EmptyState icon={Search} title="No hay más resultados" description="Esta página ya no tiene movimientos.">
            <Button variant="outline" size="sm" onClick={() => setParam('pagina', null)}>
              Ir a la primera página
            </Button>
          </EmptyState>
        ) : items.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={Search}
              title="Sin resultados"
              description="Ningún movimiento coincide con la búsqueda o los filtros."
            />
          ) : (
            <EmptyState
              icon={History}
              title="Aún no hay movimientos"
              description="Aquí quedará el registro de cada entrada, salida, venta y ajuste de inventario."
            />
          )
        ) : (
          <div className={cn(movements.isPlaceholderData && 'opacity-60 transition-opacity')}>
            <MovementsTable movements={items} />
            <TablePagination
              page={filters.page}
              pageCount={pageCount}
              total={total}
              from={from + 1}
              to={from + items.length}
              onPageChange={(page) => setParam('pagina', page === 1 ? null : String(page))}
            />
          </div>
        )}
      </div>
    </div>
  )
}
