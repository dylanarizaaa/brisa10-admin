import { SearchInput } from '@/components/shared/search-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMovementUsers, type useMovementFilters } from '../hooks/use-movements'
import { movementTypeLabels, movementTypes } from '../types'

type MovementFiltersBarProps = Pick<ReturnType<typeof useMovementFilters>, 'filters' | 'setParam'>

export function MovementFiltersBar({ filters, setParam }: MovementFiltersBarProps) {
  const users = useMovementUsers()

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
      <SearchInput
        className="xl:max-w-xs xl:flex-1"
        placeholder="Buscar producto…"
        value={filters.search}
        onChange={(value) => setParam('q', value)}
      />
      <div className="grid grid-cols-2 items-end gap-3 lg:flex">
        <Select value={filters.type} onValueChange={(value) => setParam('tipo', value)}>
          <SelectTrigger className="w-full lg:w-48" aria-label="Filtrar por tipo de movimiento">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {movementTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {movementTypeLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.userId ?? 'all'} onValueChange={(value) => setParam('usuario', value)}>
          <SelectTrigger className="w-full lg:w-48" aria-label="Filtrar por usuario">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los usuarios</SelectItem>
            {users.data?.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="movements-from" className="text-xs text-muted-foreground">
            Desde
          </Label>
          <Input
            id="movements-from"
            type="date"
            className="lg:w-40"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(event) => setParam('desde', event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="movements-to" className="text-xs text-muted-foreground">
            Hasta
          </Label>
          <Input
            id="movements-to"
            type="date"
            className="lg:w-40"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(event) => setParam('hasta', event.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
