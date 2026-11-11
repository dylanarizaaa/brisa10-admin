import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
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
import type { Product } from '@/features/products/types'
import { useStockOperation } from '../hooks/use-inventory'
import { movementSchema, type MovementValues } from '../schemas/movement-schema'
import { movementModeLabels, type MovementMode } from '../types'

interface MovementDialogProps {
  /** Operación y producto en curso; null mantiene el diálogo cerrado. */
  target: { mode: MovementMode; product: Product } | null
  onClose: () => void
}

const fieldCopy: Record<MovementMode, { quantity: string; reason: string; placeholder: string }> = {
  entrada: { quantity: 'Unidades que entran', reason: 'Motivo', placeholder: 'Ej. Compra a proveedor' },
  salida: { quantity: 'Unidades que salen', reason: 'Motivo', placeholder: 'Ej. Producto dañado' },
  ajuste: { quantity: 'Existencias reales contadas', reason: 'Motivo', placeholder: 'Ej. Conteo físico' },
}

export function MovementDialog({ target, onClose }: MovementDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {target && (
          <>
            <DialogHeader>
              <DialogTitle>{movementModeLabels[target.mode].title}</DialogTitle>
              <DialogDescription>{target.product.name}</DialogDescription>
            </DialogHeader>
            {/* El formulario se monta con el diálogo: cada operación parte de valores limpios. */}
            <MovementForm mode={target.mode} product={target.product} onDone={onClose} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function MovementForm({ mode, product, onDone }: { mode: MovementMode; product: Product; onDone: () => void }) {
  const operation = useStockOperation()
  const copy = fieldCopy[mode]
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MovementValues>({
    resolver: zodResolver(movementSchema(mode, product.stock)),
    defaultValues: { quantity: '', reason: '' },
  })

  // Vista previa de cómo quedarán las existencias con lo que se está escribiendo.
  const typed = useWatch({ control, name: 'quantity' }).trim()
  const amount = /^\d+$/.test(typed) ? Number(typed) : null
  const resulting =
    amount === null
      ? null
      : mode === 'ajuste'
        ? amount
        : mode === 'entrada'
          ? product.stock + amount
          : product.stock - amount

  const onSubmit = handleSubmit((values) =>
    operation.mutate(
      { productId: product.id, mode, quantity: Number(values.quantity), reason: values.reason },
      { onSuccess: onDone },
    ),
  )

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-md bg-muted px-3 py-2 text-sm">
        <span className="text-muted-foreground">Existencias</span>
        <span className="font-medium tabular-nums">{product.stock}</span>
        {resulting !== null && resulting >= 0 && resulting !== product.stock && (
          <>
            <ArrowRight className="size-4 text-muted-foreground" />
            <span className="font-medium tabular-nums" aria-label="Existencias después de la operación">
              {resulting}
            </span>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="movement-quantity">{copy.quantity}</Label>
        <Input
          id="movement-quantity"
          autoFocus
          inputMode="numeric"
          aria-invalid={Boolean(errors.quantity)}
          {...register('quantity')}
        />
        {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="movement-reason">
          {copy.reason}
          {mode === 'entrada' && <span className="font-normal text-muted-foreground">(opcional)</span>}
        </Label>
        <Textarea
          id="movement-reason"
          rows={2}
          placeholder={copy.placeholder}
          aria-invalid={Boolean(errors.reason)}
          {...register('reason')}
        />
        {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
      </div>

      {operation.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {operation.error.message}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={operation.isPending} onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={operation.isPending}>
          {operation.isPending && <Loader2 className="animate-spin" />}
          {movementModeLabels[mode].action}
        </Button>
      </DialogFooter>
    </form>
  )
}
