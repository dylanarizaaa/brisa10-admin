import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { useSaleFilters } from '../hooks/use-sale-filters'
import { paymentMethodLabels, paymentMethods } from '../types'

type SaleFiltersBarProps = Pick<ReturnType<typeof useSaleFilters>, 'filters' | 'setParam'>

export function SaleFiltersBar({ filters, setParam }: SaleFiltersBarProps) {
  return (
    <div className="grid grid-cols-2 items-end gap-3 lg:flex">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sales-from" className="text-xs text-muted-foreground">
          Desde
        </Label>
        <Input
          id="sales-from"
          type="date"
          className="lg:w-40"
          value={filters.from}
          max={filters.to || undefined}
          onChange={(event) => setParam('desde', event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sales-to" className="text-xs text-muted-foreground">
          Hasta
        </Label>
        <Input
          id="sales-to"
          type="date"
          className="lg:w-40"
          value={filters.to}
          min={filters.from || undefined}
          onChange={(event) => setParam('hasta', event.target.value)}
        />
      </div>

      <Select value={filters.payment} onValueChange={(value) => setParam('pago', value)}>
        <SelectTrigger className="w-full lg:w-48" aria-label="Filtrar por método de pago">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los pagos</SelectItem>
          {paymentMethods.map((method) => (
            <SelectItem key={method} value={method}>
              {paymentMethodLabels[method]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.status} onValueChange={(value) => setParam('estado', value)}>
        <SelectTrigger className="w-full lg:w-44" aria-label="Filtrar por estado">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="completada">Completadas</SelectItem>
          <SelectItem value="anulada">Anuladas</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
