import { Search, Warehouse } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState, ErrorState } from '@/components/shared/state-message'
import { TablePagination } from '@/components/shared/table-pagination'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser } from '@/features/auth/auth-context'
import { ProductFiltersBar } from '@/features/products/components/product-filters-bar'
import { useProductFilters } from '@/features/products/hooks/use-product-filters'
import { useProducts } from '@/features/products/hooks/use-products'
import { PRODUCTS_PAGE_SIZE, type Product } from '@/features/products/types'
import { cn } from '@/lib/utils'
import { InventoryTable } from '../components/inventory-table'
import { MovementDialog } from '../components/movement-dialog'
import { StockAlerts } from '../components/stock-alerts'
import type { MovementMode } from '../types'

export function InventoryPage() {
  const { isAdmin } = useCurrentUser()
  const { filters, setParam, hasFilters } = useProductFilters()
  const products = useProducts(filters)
  const [target, setTarget] = useState<{ mode: MovementMode; product: Product } | null>(null)

  const total = products.data?.total ?? 0
  const items = products.data?.items ?? []
  const pageCount = Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE))
  const from = (filters.page - 1) * PRODUCTS_PAGE_SIZE

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Inventario"
        description="Existencias de cada producto. Registra entradas, salidas y ajustes."
      />

      <StockAlerts onFilter={(availability) => setParam('existencias', availability)} />

      <ProductFiltersBar filters={filters} setParam={setParam} />

      <div className="overflow-hidden rounded-lg border">
        {products.isPending ? (
          <div className="flex flex-col gap-3 p-4" role="status" aria-label="Cargando inventario">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : products.isError ? (
          <ErrorState message={products.error.message} onRetry={() => void products.refetch()} />
        ) : items.length === 0 && filters.page > 1 ? (
          <EmptyState icon={Search} title="No hay más resultados" description="Esta página ya no tiene productos.">
            <Button variant="outline" size="sm" onClick={() => setParam('pagina', null)}>
              Ir a la primera página
            </Button>
          </EmptyState>
        ) : items.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={Search}
              title="Sin resultados"
              description="Ningún producto coincide con la búsqueda o los filtros."
            />
          ) : (
            <EmptyState
              icon={Warehouse}
              title="Aún no hay productos"
              description="El inventario se lleva por producto. Registra primero los productos del negocio."
            >
              {isAdmin && (
                <Button asChild size="sm">
                  <Link to="/productos/nuevo">Nuevo producto</Link>
                </Button>
              )}
            </EmptyState>
          )
        ) : (
          <div className={cn(products.isPlaceholderData && 'opacity-60 transition-opacity')}>
            <InventoryTable
              products={items}
              canAdjust={isAdmin}
              onOperation={(mode, product) => setTarget({ mode, product })}
            />
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

      <MovementDialog target={target} onClose={() => setTarget(null)} />
    </div>
  )
}
