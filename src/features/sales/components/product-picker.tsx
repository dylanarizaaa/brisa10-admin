import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { SearchInput } from '@/components/shared/search-input'
import { EmptyState, ErrorState } from '@/components/shared/state-message'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductThumbnail } from '@/features/products/components/product-thumbnail'
import { useProducts } from '@/features/products/hooks/use-products'
import type { Product } from '@/features/products/types'
import { formatCOP } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ProductPickerProps {
  /** Unidades de cada producto que ya están en el carrito. */
  inCart: Record<string, number>
  onAdd: (product: Product) => void
}

/** Buscador de productos activos para agregarlos a la venta. */
export function ProductPicker({ inCart, onAdd }: ProductPickerProps) {
  const [search, setSearch] = useState('')
  const products = useProducts({ search, categoryId: null, availability: 'all', active: 'active', page: 1 })
  const items = products.data?.items ?? []
  const total = products.data?.total ?? 0

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <SearchInput placeholder="Buscar producto por nombre o código…" value={search} onChange={setSearch} />

      <div className="overflow-hidden rounded-lg border">
        {products.isPending ? (
          <div className="flex flex-col gap-3 p-4" role="status" aria-label="Cargando productos">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : products.isError ? (
          <ErrorState message={products.error.message} onRetry={() => void products.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Search}
            title={search.trim() ? 'Sin resultados' : 'No hay productos activos'}
            description={search.trim() ? 'Ningún producto activo coincide con la búsqueda.' : undefined}
          />
        ) : (
          <ul className={cn('divide-y', products.isPlaceholderData && 'opacity-60 transition-opacity')}>
            {items.map((product) => {
              const remaining = product.stock - (inCart[product.id] ?? 0)
              const soldOut = product.stock === 0
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    disabled={remaining <= 0}
                    onClick={() => onAdd(product)}
                    aria-label={`Agregar ${product.name}`}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                  >
                    <ProductThumbnail storagePath={product.main_image_path} alt="" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{product.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {soldOut
                          ? 'Agotado'
                          : remaining <= 0
                            ? 'Todas las existencias están en la venta'
                            : `${remaining} ${remaining === 1 ? 'disponible' : 'disponibles'}`}
                        {product.sku && ` · ${product.sku}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium tabular-nums">{formatCOP(product.price)}</span>
                    <Plus className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {total > items.length && (
        <p className="text-xs text-muted-foreground">
          Se muestran {items.length} de {total} productos. Escribe para afinar la búsqueda.
        </p>
      )}
    </section>
  )
}
