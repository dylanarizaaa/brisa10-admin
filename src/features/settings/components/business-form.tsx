import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUpdateBusinessSettings } from '../hooks/use-settings'
import { businessSchema, type BusinessValues } from '../schemas/settings-schema'
import type { BusinessSettings } from '../types'
import { FormField } from './form-field'

interface BusinessFormProps {
  settings: BusinessSettings
  /** Sin permiso de edición los campos se muestran deshabilitados. */
  canEdit: boolean
}

export function BusinessForm({ settings, canEdit }: BusinessFormProps) {
  const update = useUpdateBusinessSettings()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<BusinessValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: settings.business_name,
      nit: settings.nit ?? '',
      phone: settings.phone ?? '',
      address: settings.address ?? '',
      email: settings.email ?? '',
      lowStockThreshold: String(settings.low_stock_threshold),
    },
  })

  return (
    <form
      noValidate
      className="flex max-w-2xl flex-col gap-5"
      // Tras guardar, los valores enviados pasan a ser el nuevo punto de partida del formulario.
      onSubmit={handleSubmit((values) => update.mutate(values, { onSuccess: () => reset(values) }))}
    >
      {!canEdit && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Solo un administrador puede cambiar esta información.
        </p>
      )}

      <FormField id="business-name" label="Nombre del negocio" error={errors.businessName?.message}>
        <Input
          id="business-name"
          disabled={!canEdit}
          aria-invalid={Boolean(errors.businessName)}
          {...register('businessName')}
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="business-nit" label="NIT" optional error={errors.nit?.message}>
          <Input id="business-nit" disabled={!canEdit} aria-invalid={Boolean(errors.nit)} {...register('nit')} />
        </FormField>
        <FormField id="business-phone" label="Teléfono" optional error={errors.phone?.message}>
          <Input
            id="business-phone"
            type="tel"
            disabled={!canEdit}
            aria-invalid={Boolean(errors.phone)}
            {...register('phone')}
          />
        </FormField>
      </div>

      <FormField id="business-address" label="Dirección" optional error={errors.address?.message}>
        <Input
          id="business-address"
          disabled={!canEdit}
          aria-invalid={Boolean(errors.address)}
          {...register('address')}
        />
      </FormField>

      <FormField id="business-email" label="Correo de contacto" optional error={errors.email?.message}>
        <Input
          id="business-email"
          type="email"
          disabled={!canEdit}
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="business-threshold"
          label="Umbral de bajo inventario"
          hint="Un producto se marca con bajo inventario cuando sus existencias son iguales o menores a este número, salvo que tenga su propio stock mínimo."
          error={errors.lowStockThreshold?.message}
        >
          <Input
            id="business-threshold"
            inputMode="numeric"
            disabled={!canEdit}
            aria-invalid={Boolean(errors.lowStockThreshold)}
            {...register('lowStockThreshold')}
          />
        </FormField>
      </div>

      {update.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {update.error.message}
        </p>
      )}

      {canEdit && (
        <div>
          <Button type="submit" disabled={update.isPending || !isDirty}>
            {update.isPending && <Loader2 className="animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      )}
    </form>
  )
}
