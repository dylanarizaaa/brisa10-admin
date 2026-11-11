import { Plus, Receipt, Search } from 'lucide-react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState, ErrorState } from '@/components/shared/state-message'
import { TablePagination } from '@/components/shared/table-pagination'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { SaleFiltersBar } from '../components/sale-filters-bar'
import { SalesTable } from '../components/sales-table'
import { useSaleFilters } from '../hooks/use-sale-filters'
import { useSales } from '../hooks/use-sales'
import { SALES_PAGE_SIZE } from '../types'

export function SalesPage() {
  const { filters, setParam, hasFilters } = useSaleFilters()
  const sales = useSales(filters)

  const total = sales.data?.total ?? 0
  const items = sales.data?.items ?? []
  const pageCount = Math.max(1, Math.ceil(total / SALES_PAGE_SIZE))
  const from = (filters.page - 1) * SALES_PAGE_SIZE

  const newSaleButton = (
    <Button asChild>
      <Link to="/ventas/nueva">
        <Plus />
        Nueva venta
      </Link>
    </Button>
  )

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title="Ventas" description="Historial de ventas realizadas en la tienda.">
        {newSaleButton}
      </PageHeader>

      <SaleFiltersBar filters={filters} setParam={setParam} />

      <div className="overflow-hidden rounded-lg border">
        {sales.isPending ? (
          <div className="flex flex-col gap-3 p-4" role="status" aria-label="Cargando ventas">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : sales.isError ? (
          <ErrorState message={sales.error.message} onRetry={() => void sales.refetch()} />
        ) : items.length === 0 && filters.page > 1 ? (
          <EmptyState icon={Search} title="No hay más resultados" description="Esta página ya no tiene ventas.">
            <Button variant="outline" size="sm" onClick={() => setParam('pagina', null)}>
              Ir a la primera página
            </Button>
          </EmptyState>
        ) : items.length === 0 ? (
          hasFilters ? (
            <EmptyState icon={Search} title="Sin resultados" description="Ninguna venta coincide con los filtros." />
          ) : (
            <EmptyState
              icon={Receipt}
              title="Aún no hay ventas"
              description="Las ventas que registres aparecerán aquí."
            >
              {newSaleButton}
            </EmptyState>
          )
        ) : (
          <div className={cn(sales.isPlaceholderData && 'opacity-60 transition-opacity')}>
            <SalesTable sales={items} />
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
