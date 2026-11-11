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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCancelSale } from '../hooks/use-sales'
import { cancelSaleSchema, type CancelSaleValues } from '../schemas/sale-schema'

interface CancelSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId: string
  saleNumber: number
}

export function CancelSaleDialog({ open, onOpenChange, saleId, saleNumber }: CancelSaleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anular venta N.º {saleNumber}</DialogTitle>
          <DialogDescription>
            Los productos vuelven al inventario y la venta deja de contar en los ingresos. La anulación queda
            registrada y no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <CancelSaleForm saleId={saleId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function CancelSaleForm({ saleId, onDone }: { saleId: string; onDone: () => void }) {
  const cancel = useCancelSale()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CancelSaleValues>({ resolver: zodResolver(cancelSaleSchema), defaultValues: { reason: '' } })

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={handleSubmit(({ reason }) => cancel.mutate({ id: saleId, reason }, { onSuccess: onDone }))}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="cancel-reason">Motivo</Label>
        <Textarea
          id="cancel-reason"
          rows={3}
          autoFocus
          placeholder="Ej. El cliente devolvió los productos"
          aria-invalid={Boolean(errors.reason)}
          {...register('reason')}
        />
        {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
      </div>

      {cancel.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {cancel.error.message}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={cancel.isPending} onClick={onDone}>
          Volver
        </Button>
        <Button type="submit" variant="destructive" disabled={cancel.isPending}>
          {cancel.isPending && <Loader2 className="animate-spin" />}
          Anular venta
        </Button>
      </DialogFooter>
    </form>
  )
}
