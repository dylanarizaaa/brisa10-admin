import { ArrowLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { formatCOP } from '@/lib/format'
import type { PaymentMethod } from '@/types/database'
import { CartPanel } from '../components/cart-panel'
import { ProductPicker } from '../components/product-picker'
import { useCart } from '../hooks/use-cart'
import { useCreateSale } from '../hooks/use-sales'
import { paymentMethodLabels } from '../types'

export function NewSalePage() {
  const navigate = useNavigate()
  const cart = useCart()
  const createSale = useCreateSale()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [notes, setNotes] = useState('')
  const [validationError, setValidationError] = useState<string>()
  const [confirming, setConfirming] = useState(false)

  const inCart = useMemo(
    () => Object.fromEntries(cart.lines.map((line) => [line.productId, line.quantity])),
    [cart.lines],
  )

  function handleSubmit() {
    if (!paymentMethod) {
      setValidationError('Selecciona el método de pago')
      return
    }
    setValidationError(undefined)
    createSale.reset()
    setConfirming(true)
  }

  function handleConfirm() {
    if (!paymentMethod) return
    createSale.mutate(
      {
        items: cart.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        paymentMethod,
        notes,
      },
      {
        onSuccess: ({ id }) => void navigate(`/ventas/${id}`, { replace: true }),
        onSettled: () => setConfirming(false),
      },
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Link to="/ventas" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Ventas
      </Link>
      <PageHeader title="Nueva venta" description="Agrega los productos, elige el método de pago y confirma." />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <ProductPicker inCart={inCart} onAdd={cart.add} />
        <CartPanel
          cart={cart}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={(method) => {
            setPaymentMethod(method)
            setValidationError(undefined)
          }}
          notes={notes}
          onNotesChange={setNotes}
          error={validationError ?? createSale.error?.message}
          submitting={createSale.isPending}
          onSubmit={handleSubmit}
        />
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="¿Confirmar venta?"
        description={
          paymentMethod
            ? `${cart.units} ${cart.units === 1 ? 'unidad' : 'unidades'} por ${formatCOP(cart.total)}, pago con ${paymentMethodLabels[paymentMethod].toLowerCase()}. Las existencias se descontarán del inventario.`
            : ''
        }
        confirmLabel="Confirmar venta"
        loading={createSale.isPending}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
