import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/shared/state-message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatCOP } from '@/lib/format'
import type { PaymentMethod } from '@/types/database'
import type { Cart } from '../hooks/use-cart'
import { NOTES_MAX_LENGTH } from '../schemas/sale-schema'
import { paymentMethodLabels, paymentMethods } from '../types'

interface CartPanelProps {
  cart: Cart
  paymentMethod: PaymentMethod | ''
  onPaymentMethodChange: (method: PaymentMethod) => void
  notes: string
  onNotesChange: (notes: string) => void
  /** Mensaje de validación o del servidor a mostrar sobre el botón. */
  error?: string
  submitting: boolean
  onSubmit: () => void
}

export function CartPanel({
  cart,
  paymentMethod,
  onPaymentMethodChange,
  notes,
  onNotesChange,
  error,
  submitting,
  onSubmit,
}: CartPanelProps) {
  return (
    <section className="flex min-w-0 flex-col rounded-lg border bg-card" aria-label="Venta en curso">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-medium">Venta en curso</h2>
        {cart.lines.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {cart.units} {cart.units === 1 ? 'unidad' : 'unidades'}
          </span>
        )}
      </div>

      {cart.lines.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Sin productos"
          description="Busca un producto y púlsalo para agregarlo a la venta."
        />
      ) : (
        <ul className="divide-y">
          {cart.lines.map((line) => (
            <li key={line.productId} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{line.name}</span>
                  <span className="text-xs text-muted-foreground">{formatCOP(line.price)} c/u</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Quitar ${line.name}`}
                  disabled={submitting}
                  onClick={() => cart.remove(line.productId)}
                >
                  <Trash2 />
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Restar una unidad de ${line.name}`}
                    disabled={submitting || line.quantity <= 1}
                    onClick={() => cart.setQuantity(line.productId, line.quantity - 1)}
                  >
                    <Minus />
                  </Button>
                  <Input
                    inputMode="numeric"
                    aria-label={`Cantidad de ${line.name}`}
                    className="h-7 w-14 text-center tabular-nums"
                    disabled={submitting}
                    value={line.quantity}
                    onFocus={(event) => event.target.select()}
                    onChange={(event) =>
                      cart.setQuantity(line.productId, Number(event.target.value.replace(/\D/g, '')))
                    }
                  />
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Sumar una unidad de ${line.name}`}
                    disabled={submitting || line.quantity >= line.stock}
                    onClick={() => cart.setQuantity(line.productId, line.quantity + 1)}
                  >
                    <Plus />
                  </Button>
                  {line.quantity >= line.stock && (
                    <span className="ml-1 text-xs text-muted-foreground">Máx. {line.stock}</span>
                  )}
                </div>
                <span className="text-sm font-medium tabular-nums" aria-label={`Subtotal de ${line.name}`}>
                  {formatCOP(line.price * line.quantity)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-4 border-t p-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="sale-payment">Método de pago</Label>
          <Select
            value={paymentMethod}
            onValueChange={(value) => onPaymentMethodChange(value as PaymentMethod)}
            disabled={submitting}
          >
            <SelectTrigger id="sale-payment" className="w-full">
              <SelectValue placeholder="Selecciona el método de pago" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {paymentMethodLabels[method]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="sale-notes">
            Notas <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Textarea
            id="sale-notes"
            rows={2}
            maxLength={NOTES_MAX_LENGTH}
            disabled={submitting}
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
          />
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-2xl font-semibold tracking-tight tabular-nums" aria-label="Total de la venta">
            {formatCOP(cart.total)}
          </span>
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button size="lg" disabled={submitting || cart.lines.length === 0} onClick={onSubmit}>
          {submitting && <Loader2 className="animate-spin" />}
          Confirmar venta
        </Button>
      </div>
    </section>
  )
}
