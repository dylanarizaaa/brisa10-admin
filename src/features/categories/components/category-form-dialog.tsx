import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSaveCategory } from '../hooks/use-categories'
import { categorySchema, type CategoryValues } from '../schemas/category-schema'
import type { Category } from '../types'

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Categoría a editar; sin ella el diálogo crea una nueva. */
  category?: Category
}

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
          <DialogDescription>Las categorías organizan los productos del negocio.</DialogDescription>
        </DialogHeader>
        {/* El formulario se monta con el diálogo, así siempre parte de valores limpios. */}
        <CategoryForm category={category} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function CategoryForm({ category, onDone }: { category?: Category; onDone: () => void }) {
  const save = useSaveCategory()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category?.name ?? '', description: category?.description ?? '' },
  })

  const onSubmit = handleSubmit((values) => save.mutate({ id: category?.id, values }, { onSuccess: onDone }))

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="category-name">Nombre</Label>
        <Input
          id="category-name"
          autoFocus
          placeholder="Ej. Cerámicas"
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="category-description">
          Descripción <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="category-description"
          rows={3}
          aria-invalid={Boolean(errors.description)}
          {...register('description')}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      {save.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {save.error.message}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={save.isPending} onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2 className="animate-spin" />}
          {category ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
      </DialogFooter>
    </form>
  )
}
