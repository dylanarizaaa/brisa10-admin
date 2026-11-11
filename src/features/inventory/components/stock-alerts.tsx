import { CircleSlash, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboardSummary } from '@/features/dashboard/hooks/use-dashboard'
import type { AvailabilityFilter } from '@/features/products/types'

interface StockAlertsProps {
  onFilter: (availability: AvailabilityFilter) => void
}

/** Avisos de bajo inventario y agotados; cada uno aplica el filtro correspondiente. */
export function StockAlerts({ onFilter }: StockAlertsProps) {
  const { data } = useDashboardSummary()
  if (!data || (data.low_stock_products === 0 && data.out_of_stock_products === 0)) return null

  return (
    <div className="flex flex-wrap gap-2">
      {data.low_stock_products > 0 && (
        <Button variant="outline" size="sm" onClick={() => onFilter('low')}>
          <TriangleAlert className="text-amber-600" />
          {data.low_stock_products} con bajo inventario
        </Button>
      )}
      {data.out_of_stock_products > 0 && (
        <Button variant="outline" size="sm" onClick={() => onFilter('out')}>
          <CircleSlash className="text-destructive" />
          {data.out_of_stock_products} {data.out_of_stock_products === 1 ? 'agotado' : 'agotados'}
        </Button>
      )}
    </div>
  )
}
