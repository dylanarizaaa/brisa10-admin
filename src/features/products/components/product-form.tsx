import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { productSchema, type ProductValues } from '../schemas/product-schema'
import type { ProductDetail } from '../types'

interface ProductFormProps {
  /** Producto a editar; sin él el formulario crea uno nuevo. */
  product?: ProductDetail
  submitting: boolean
  error?: string
  cancelTo: string
  onSubmit: (values: ProductValues) => void
}

function Field({
  id,
  label,
  optional,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  optional?: boolean
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">(opcional)</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

export function ProductForm({ product, submitting, error, cancelTo, onSubmit }: ProductFormProps) {
  const categories = useCategories()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      sku: product?.sku ?? '',
      description: product?.description ?? '',
      categoryId: product?.category_id ?? '',
      price: product ? String(product.price) : '',
      cost: product?.cost != null ? String(product.cost) : '',
      minStock: product?.min_stock != null ? String(product.min_stock) : '',
      initialStock: '',
      isPublished: product?.is_published ?? false,
      isFeatured: product?.is_featured ?? false,
    },
  })

  // Solo categorías activas, más la actual del producto aunque esté inactiva.
  const categoryOptions = (categories.data ?? []).filter(
    (category) => category.is_active || category.id === product?.category_id,
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex max-w-2xl flex-col gap-5">
      <Field id="product-name" label="Nombre" error={errors.name?.message}>
        <Input
          id="product-name"
          autoFocus={!product}
          placeholder="Ej. Taza de cerámica pintada a mano"
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="product-category" label="Categoría" error={errors.categoryId?.message}>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={categories.isPending}>
                <SelectTrigger id="product-category" className="w-full" aria-invalid={Boolean(errors.categoryId)}>
                  <SelectValue placeholder={categories.isPending ? 'Cargando…' : 'Selecciona una categoría'} />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field
          id="product-sku"
          label="Código (SKU)"
          optional
          hint="Código propio o de barras, para encontrar el producto rápido."
          error={errors.sku?.message}
        >
          <Input id="product-sku" aria-invalid={Boolean(errors.sku)} {...register('sku')} />
        </Field>
      </div>

      <Field id="product-description" label="Descripción" optional error={errors.description?.message}>
        <Textarea
          id="product-description"
          rows={4}
          aria-invalid={Boolean(errors.description)}
          {...register('description')}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field id="product-price" label="Precio de venta" hint="En pesos, sin puntos." error={errors.price?.message}>
          <Input
            id="product-price"
            inputMode="numeric"
            placeholder="25000"
            aria-invalid={Boolean(errors.price)}
            {...register('price')}
          />
        </Field>

        <Field
          id="product-cost"
          label="Costo"
          optional
          hint="Lo que te cuesta adquirirlo."
          error={errors.cost?.message}
        >
          <Input id="product-cost" inputMode="numeric" aria-invalid={Boolean(errors.cost)} {...register('cost')} />
        </Field>

        <Field
          id="product-min-stock"
          label="Stock mínimo"
          optional
          hint="Vacío usa el umbral general."
          error={errors.minStock?.message}
        >
          <Input
            id="product-min-stock"
            inputMode="numeric"
            aria-invalid={Boolean(errors.minStock)}
            {...register('minStock')}
          />
        </Field>
      </div>

      {!product && (
        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            id="product-initial-stock"
            label="Existencias iniciales"
            optional
            hint="Unidades que tienes hoy. Se registran como una entrada de inventario."
            error={errors.initialStock?.message}
          >
            <Input
              id="product-initial-stock"
              inputMode="numeric"
              aria-invalid={Boolean(errors.initialStock)}
              {...register('initialStock')}
            />
          </Field>
        </div>
      )}

      <fieldset className="flex flex-col gap-4 rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium">Tienda virtual</legend>
        {(
          [
            {
              name: 'isPublished',
              label: 'Publicar en la tienda virtual',
              hint: 'Los clientes lo verán en el catálogo público mientras esté activo. Agrega al menos una fotografía.',
            },
            {
              name: 'isFeatured',
              label: 'Producto destacado',
              hint: 'Aparece en la sección de destacados de la página de inicio.',
            },
          ] as const
        ).map((option) => (
          <Controller
            key={option.name}
            control={control}
            name={option.name}
            render={({ field }) => (
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`product-${option.name}`}>{option.label}</Label>
                  <p className="text-xs text-muted-foreground">{option.hint}</p>
                </div>
                <Switch id={`product-${option.name}`} checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />
        ))}
      </fieldset>

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          {product ? 'Guardar cambios' : 'Crear producto'}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link to={cancelTo}>Cancelar</Link>
        </Button>
      </div>
    </form>
  )
}
