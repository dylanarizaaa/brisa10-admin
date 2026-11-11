import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCurrentUser } from '@/features/auth/auth-context'
import { roleLabels } from '@/features/auth/types'
import { useUpdateOwnName } from '../hooks/use-settings'
import { accountSchema, type AccountValues } from '../schemas/settings-schema'
import { FormField } from './form-field'

export function AccountForm() {
  const user = useCurrentUser()
  const update = useUpdateOwnName(user.id)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { fullName: user.full_name },
  })

  return (
    <form
      noValidate
      className="flex max-w-md flex-col gap-5"
      onSubmit={handleSubmit((values) => update.mutate(values.fullName, { onSuccess: () => reset(values) }))}
    >
      <FormField id="account-name" label="Nombre" error={errors.fullName?.message}>
        <Input id="account-name" aria-invalid={Boolean(errors.fullName)} {...register('fullName')} />
      </FormField>

      <FormField id="account-email" label="Correo" hint="El correo y la contraseña se cambian desde el panel de Supabase.">
        <Input id="account-email" value={user.email} disabled readOnly />
      </FormField>

      <FormField id="account-role" label="Rol">
        <Input id="account-role" value={roleLabels[user.role]} disabled readOnly />
      </FormField>

      {update.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {update.error.message}
        </p>
      )}

      <div>
        <Button type="submit" disabled={update.isPending || !isDirty}>
          {update.isPending && <Loader2 className="animate-spin" />}
          Guardar nombre
        </Button>
      </div>
    </form>
  )
}
