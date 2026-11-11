import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { StockStatus } from '@/types/database'
import { stockStatusLabels } from '../types'

const statusClasses: Record<StockStatus, string> = {
  disponible: 'border-transparent bg-emerald-50 text-emerald-700',
  bajo: 'border-transparent bg-amber-50 text-amber-700',
  agotado: 'border-transparent bg-red-50 text-red-700',
}

export function StockBadge({ status }: { status: StockStatus }) {
  return (
    <Badge variant="outline" className={cn(statusClasses[status])}>
      {stockStatusLabels[status]}
    </Badge>
  )
}
