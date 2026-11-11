import { TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  /** Acción sugerida (p. ej. botón "Crear"). */
  children?: ReactNode
  className?: string
}

/** Estado vacío para listas y tablas sin resultados. */
export function EmptyState({ icon: Icon, title, description, children, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-12 text-center', className)}>
      <Icon className="size-8 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  className?: string
}

/** Estado de error para consultas fallidas, con opción de reintentar. */
export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center gap-2 px-6 py-12 text-center', className)}>
      <TriangleAlert className="size-8 text-destructive" />
      <p className="font-medium">No se pudo cargar la información</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
