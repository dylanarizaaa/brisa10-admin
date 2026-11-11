import { Plus, Search, Tags } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState, ErrorState } from '@/components/shared/state-message'
import { TablePagination } from '@/components/shared/table-pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser } from '@/features/auth/auth-context'
import { usePagination } from '@/hooks/use-pagination'
import { normalizeText } from '@/lib/text'
import { CategoriesTable } from '../components/categories-table'
import { CategoryFormDialog } from '../components/category-form-dialog'
import { useCategories, useSetCategoryActive } from '../hooks/use-categories'
import type { Category, CategoryStatusFilter } from '../types'

/** Qué diálogo está abierto y sobre qué categoría. */
type DialogState =
  | { type: 'create' }
  | { type: 'edit'; category: Category }
  | { type: 'deactivate'; category: Category }
  | null

export function CategoriesPage() {
  const { isAdmin } = useCurrentUser()
  const categories = useCategories()
  const setActive = useSetCategoryActive()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CategoryStatusFilter>('all')
  const [dialog, setDialog] = useState<DialogState>(null)

  const filtered = useMemo(() => {
    const term = normalizeText(search.trim())
    return (categories.data ?? []).filter(
      (category) =>
        (status === 'all' || category.is_active === (status === 'active')) &&
        (!term || normalizeText(category.name).includes(term)),
    )
  }, [categories.data, search, status])

  const pagination = usePagination(filtered, 10)
  const hasFilters = search.trim() !== '' || status !== 'all'

  function handleToggleActive(category: Category) {
    // Activar es inofensivo; desactivar pide confirmación.
    if (category.is_active) setDialog({ type: 'deactivate', category })
    else setActive.mutate({ id: category.id, isActive: true })
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title="Categorías" description="Organiza los productos del negocio por tipo.">
        {isAdmin && (
          <Button onClick={() => setDialog({ type: 'create' })}>
            <Plus />
            Nueva categoría
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar categoría…"
            aria-label="Buscar categoría"
            className="pl-8"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={status} onValueChange={(value) => setStatus(value as CategoryStatusFilter)}>
          <SelectTrigger className="sm:w-44" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="inactive">Inactivas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border">
        {categories.isPending ? (
          <div className="flex flex-col gap-3 p-4" role="status" aria-label="Cargando categorías">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : categories.isError ? (
          <ErrorState message={categories.error.message} onRetry={() => void categories.refetch()} />
        ) : filtered.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={Search}
              title="Sin resultados"
              description="Ninguna categoría coincide con la búsqueda o el filtro."
            />
          ) : (
            <EmptyState
              icon={Tags}
              title="Aún no hay categorías"
              description="Crea la primera categoría para empezar a organizar los productos."
            />
          )
        ) : (
          <>
            <CategoriesTable
              categories={pagination.pageItems}
              canEdit={isAdmin}
              onEdit={(category) => setDialog({ type: 'edit', category })}
              onToggleActive={handleToggleActive}
            />
            <TablePagination {...pagination} onPageChange={pagination.setPage} />
          </>
        )}
      </div>

      <CategoryFormDialog
        open={dialog?.type === 'create' || dialog?.type === 'edit'}
        onOpenChange={(open) => !open && setDialog(null)}
        category={dialog?.type === 'edit' ? dialog.category : undefined}
      />

      <ConfirmDialog
        open={dialog?.type === 'deactivate'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="¿Desactivar categoría?"
        description={
          dialog?.type === 'deactivate'
            ? `"${dialog.category.name}" dejará de estar disponible para productos nuevos. Los productos que ya la usan no cambian, y puedes reactivarla cuando quieras.`
            : ''
        }
        confirmLabel="Desactivar"
        destructive
        loading={setActive.isPending}
        onConfirm={() => {
          if (dialog?.type !== 'deactivate') return
          setActive.mutate({ id: dialog.category.id, isActive: false }, { onSettled: () => setDialog(null) })
        }}
      />
    </div>
  )
}
