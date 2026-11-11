import { Loader2, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface FullScreenMessageProps {
  icon?: LucideIcon
  title: string
  description?: string
  children?: ReactNode
}

/** Mensaje centrado a pantalla completa: errores de configuración, cuenta inactiva, etc. */
export function FullScreenMessage({ icon: Icon, title, description, children }: FullScreenMessageProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-muted/40 p-6 text-center">
      {Icon && <Icon className="size-8 text-muted-foreground" />}
      <h1 className="text-lg font-semibold">{title}</h1>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-2 flex gap-2">{children}</div>}
    </div>
  )
}

export function FullScreenLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center" role="status" aria-label="Cargando">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}
