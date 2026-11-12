import { Package, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState, ErrorState } from '@/components/shared/state-message'
import { TablePagination } from '@/components/shared/table-pagination'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser } from '@/features/auth/auth-context'
import { cn } from '@/lib/utils'
import { ProductFiltersBar } from '../components/product-filters-bar'
import { ProductsTable } from '../components/products-table'
import { useProductFilters } from '../hooks/use-product-filters'
import { useProducts, useSetProductActive, useSetProductPublished } from '../hooks/use-products'
import { PRODUCTS_PAGE_SIZE, type Product } from '../types'

export function ProductsPage() {
  const { isAdmin } = useCurrentUser()
  const { filters, setParam, hasFilters } = useProductFilters()
  const products = useProducts(filters)
  const setActive = useSetProductActive()
  const setPublished = useSetProductPublished()
  const [toDeactivate, setToDeactivate] = useState<Product | null>(null)

  const total = products.data?.total ?? 0
  const items = products.data?.items ?? []
  const pageCount = Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE))
  const from = (filters.page - 1) * PRODUCTS_PAGE_SIZE

  function handleToggleActive(product: Product) {
    if (product.is_active) setToDeactivate(product)
    else setActive.mutate({ id: product.id, isActive: true })
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title="Productos" description="Catálogo de productos del negocio.">
        {isAdmin && (
          <Button asChild>
            <Link to="/productos/nuevo">
              <Plus />
              Nuevo producto
            </Link>
          </Button>
        )}
      </PageHeader>

      <ProductFiltersBar filters={filters} setParam={setParam} />

      <div className="overflow-hidden rounded-lg border">
        {products.isPending ? (
          <div className="flex flex-col gap-3 p-4" role="status" aria-label="Cargando productos">
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
              icon={Package}
              title="Aún no hay productos"
              description={
                isAdmin
                  ? 'Crea el primer producto para empezar a armar el catálogo.'
                  : 'El administrador todavía no ha registrado productos.'
              }
            >
              {isAdmin && (
                <Button asChild size="sm">
                  <Link to="/productos/nuevo">
                    <Plus />
                    Nuevo producto
                  </Link>
                </Button>
              )}
            </EmptyState>
          )
        ) : (
          // Atenuado mientras llega la página siguiente o el nuevo filtro.
          <div className={cn(products.isPlaceholderData && 'opacity-60 transition-opacity')}>
            <ProductsTable products={items} canEdit={isAdmin} onToggleActive={handleToggleActive}
              onTogglePublished={(product) =>
                setPublished.mutate({ id: product.id, isPublished: !product.is_published })
              }
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

      <ConfirmDialog
        open={toDeactivate !== null}
        onOpenChange={(open) => !open && setToDeactivate(null)}
        title="¿Desactivar producto?"
        description={
          toDeactivate
            ? `"${toDeactivate.name}" dejará de estar disponible para la venta. Su historial se conserva y puedes reactivarlo cuando quieras.`
            : ''
        }
        confirmLabel="Desactivar"
        destructive
        loading={setActive.isPending}
        onConfirm={() =>
          toDeactivate &&
          setActive.mutate({ id: toDeactivate.id, isActive: false }, { onSettled: () => setToDeactivate(null) })
        }
      />
    </div>
  )
}
