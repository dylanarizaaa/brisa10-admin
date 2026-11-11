import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  /** undefined mientras carga. */
  value: string | number | undefined
  hint?: string
  icon: LucideIcon
  /** Resalta el indicador cuando requiere atención. */
  tone?: 'default' | 'warning' | 'danger'
}

const toneClasses = {
  default: 'text-muted-foreground',
  warning: 'text-amber-600',
  danger: 'text-destructive',
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'default' }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={cn('size-4', toneClasses[tone])} />
      </div>
      {value === undefined ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
      )}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}
