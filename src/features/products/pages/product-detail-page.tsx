import { Globe, GlobeLock, Pencil, Power, PowerOff, Star } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/features/auth/auth-context'
import { formatCOP, formatDateTime } from '@/lib/format'
import { ProductImages } from '../components/product-images'
import { BackLink, ProductLoader } from '../components/product-page-shell'
import { StockBadge } from '../components/stock-badge'
import { useProduct, useSetProductActive, useSetProductPublished } from '../hooks/use-products'
import type { ProductDetail } from '../types'

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  )
}

function ProductDetailContent({ product }: { product: ProductDetail }) {
  const { isAdmin } = useCurrentUser()
  const setActive = useSetProductActive()
  const setPublished = useSetProductPublished()
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  return (
    <>
      <PageHeader title={product.name} description={product.category_name}>
        {isAdmin && (
          <>
            <Button
              variant="outline"
              disabled={setPublished.isPending}
              onClick={() => setPublished.mutate({ id: product.id, isPublished: !product.is_published })}
            >
              {product.is_published ? <GlobeLock /> : <Globe />}
              {product.is_published ? 'Quitar de la tienda' : 'Publicar'}
            </Button>
            <Button
              variant="outline"
              disabled={setActive.isPending}
              onClick={() =>
                product.is_active
                  ? setConfirmDeactivate(true)
                  : setActive.mutate({ id: product.id, isActive: true })
              }
            >
              {product.is_active ? <PowerOff /> : <Power />}
              {product.is_active ? 'Desactivar' : 'Activar'}
            </Button>
            <Button asChild>
              <Link to={`/productos/${product.id}/editar`}>
                <Pencil />
                Editar
              </Link>
            </Button>
          </>
        )}
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        <Badge variant={product.is_active ? 'secondary' : 'outline'}>
          {product.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
        <StockBadge status={product.stock_status} />
        <Badge variant={product.is_published ? 'secondary' : 'outline'}>
          {product.is_published ? <Globe /> : <GlobeLock />}
          {product.is_published ? 'Publicado en la tienda virtual' : 'No publicado'}
        </Badge>
        {product.is_featured && (
          <Badge variant="secondary">
            <Star />
            Destacado
          </Badge>
        )}
      </div>
      {product.is_published && !product.is_active && (
        <p className="text-sm text-muted-foreground">
          Está marcado para publicarse, pero no aparece en la tienda virtual mientras esté inactivo.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-lg border p-4 sm:grid-cols-3 lg:grid-cols-4">
        <Detail label="Precio de venta">{formatCOP(product.price)}</Detail>
        {isAdmin && <Detail label="Costo">{product.cost === null ? '—' : formatCOP(product.cost)}</Detail>}
        <Detail label="Existencias">{product.stock}</Detail>
        <Detail label="Stock mínimo">
          {product.effective_min_stock}
          {product.min_stock === null && (
            <span className="font-normal text-muted-foreground"> (umbral general)</span>
          )}
        </Detail>
        <Detail label="Código (SKU)">{product.sku ?? '—'}</Detail>
        <Detail label="Creado">{formatDateTime(product.created_at)}</Detail>
        <Detail label="Última actualización">{formatDateTime(product.updated_at)}</Detail>
      </dl>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Descripción</h2>
        <p className="max-w-2xl text-sm whitespace-pre-line text-muted-foreground">
          {product.description ?? 'Sin descripción.'}
        </p>
      </section>

      <ProductImages
        productId={product.id}
        productName={product.name}
        images={product.images}
        canEdit={isAdmin}
      />

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title="¿Desactivar producto?"
        description={`"${product.name}" dejará de estar disponible para la venta. Su historial se conserva y puedes reactivarlo cuando quieras.`}
        confirmLabel="Desactivar"
        destructive
        loading={setActive.isPending}
        onConfirm={() =>
          setActive.mutate({ id: product.id, isActive: false }, { onSettled: () => setConfirmDeactivate(false) })
        }
      />
    </>
  )
}

export function ProductDetailPage() {
  const { id = '' } = useParams()
  const product = useProduct(id)

  return (
    <div className="flex flex-1 flex-col gap-6">
      <BackLink to="/productos">Productos</BackLink>
      <ProductLoader query={product}>{(data) => <ProductDetailContent product={data} />}</ProductLoader>
    </div>
  )
}
