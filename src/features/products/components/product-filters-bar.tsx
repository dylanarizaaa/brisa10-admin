import { SearchInput } from '@/components/shared/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategories } from '@/features/categories/hooks/use-categories'
import type { useProductFilters } from '../hooks/use-product-filters'

type ProductFiltersBarProps = Pick<ReturnType<typeof useProductFilters>, 'filters' | 'setParam'>

export function ProductFiltersBar({ filters, setParam }: ProductFiltersBarProps) {
  const categories = useCategories()

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <SearchInput
        className="lg:max-w-xs lg:flex-1"
        placeholder="Buscar por nombre o código…"
        value={filters.search}
        onChange={(value) => setParam('q', value)}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex">
        <Select value={filters.categoryId ?? 'all'} onValueChange={(value) => setParam('categoria', value)}>
          <SelectTrigger className="w-full lg:w-48" aria-label="Filtrar por categoría">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.data?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.availability} onValueChange={(value) => setParam('existencias', value)}>
          <SelectTrigger className="w-full lg:w-48" aria-label="Filtrar por disponibilidad">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda disponibilidad</SelectItem>
            <SelectItem value="in_stock">Con existencias</SelectItem>
            <SelectItem value="low">Bajo inventario</SelectItem>
            <SelectItem value="out">Agotados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.active} onValueChange={(value) => setParam('estado', value)}>
          <SelectTrigger className="w-full lg:w-44" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
