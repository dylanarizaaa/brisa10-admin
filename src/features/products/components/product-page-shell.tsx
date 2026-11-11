import { ArrowLeft, PackageX } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { EmptyState, ErrorState } from '@/components/shared/state-message'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { useProduct } from '../hooks/use-products'
import type { ProductDetail } from '../types'

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" />
      {children}
    </Link>
  )
}

interface ProductLoaderProps {
  query: ReturnType<typeof useProduct>
  children: (product: ProductDetail) => ReactNode
}

/** Resuelve los estados de carga, error y "no existe" de un producto antes de mostrar el contenido. */
export function ProductLoader({ query, children }: ProductLoaderProps) {
  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Cargando producto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full max-w-2xl" />
      </div>
    )
  }
  if (query.isError) {
    return (
      <div className="rounded-lg border">
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      </div>
    )
  }
  if (!query.data) {
    return (
      <div className="rounded-lg border">
        <EmptyState icon={PackageX} title="Producto no encontrado" description="Puede que el enlace sea incorrecto.">
          <Button asChild variant="outline" size="sm">
            <Link to="/productos">Volver a productos</Link>
          </Button>
        </EmptyState>
      </div>
    )
  }
  return children(query.data)
}
