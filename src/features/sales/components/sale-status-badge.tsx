import { Badge } from '@/components/ui/badge'
import type { SaleStatus } from '@/types/database'
import { saleStatusLabels } from '../types'

export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  return (
    <Badge
      variant="outline"
      className={
        status === 'completada'
          ? 'border-transparent bg-emerald-50 text-emerald-700'
          : 'border-transparent bg-red-50 text-red-700'
      }
    >
      {saleStatusLabels[status]}
    </Badge>
  )
}
