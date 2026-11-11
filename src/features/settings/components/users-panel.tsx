import { UserCheck, UserX } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { ErrorState } from '@/components/shared/state-message'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCurrentUser } from '@/features/auth/auth-context'
import { roleLabels } from '@/features/auth/types'
import type { UserRole } from '@/types/database'
import { useUpdateUser, useUsers } from '../hooks/use-settings'
import type { UserAccount } from '../types'

/** Cambio pendiente de confirmar. */
type PendingChange =
  | { kind: 'role'; user: UserAccount; role: UserRole }
  | { kind: 'deactivate'; user: UserAccount }
  | null

export function UsersPanel() {
  const currentUser = useCurrentUser()
  const users = useUsers()
  const update = useUpdateUser()
  const [pending, setPending] = useState<PendingChange>(null)

  function confirm() {
    if (!pending) return
    const changes = pending.kind === 'role' ? { role: pending.role } : { is_active: false }
    update.mutate({ id: pending.user.id, ...changes }, { onSettled: () => setPending(null) })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Los usuarios nuevos se crean en el panel de Supabase (Authentication → Users → Add user) y aparecen aquí
        como operadores. Desde esta pantalla defines su rol y si pueden entrar al sistema.
      </p>

      <div className="overflow-hidden rounded-lg border">
        {users.isPending ? (
          <div className="flex flex-col gap-3 p-4" role="status" aria-label="Cargando usuarios">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        ) : users.isError ? (
          <ErrorState message={users.error.message} onRetry={() => void users.refetch()} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="hidden sm:table-cell">Estado</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.data.map((user) => {
                const isSelf = user.id === currentUser.id
                return (
                  <TableRow key={user.id}>
                    <TableCell className="w-full max-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium">{user.full_name}</span>
                        {isSelf && (
                          <Badge variant="outline" className="shrink-0">
                            Tú
                          </Badge>
                        )}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                    </TableCell>
                    <TableCell>
                      {isSelf ? (
                        // Nadie puede cambiar su propio rol: evita quedarse sin administradores.
                        <span className="text-sm">{roleLabels[user.role]}</span>
                      ) : (
                        <Select
                          value={user.role}
                          disabled={update.isPending}
                          onValueChange={(role) => setPending({ kind: 'role', user, role: role as UserRole })}
                        >
                          <SelectTrigger className="w-40" aria-label={`Rol de ${user.full_name}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{roleLabels.admin}</SelectItem>
                            <SelectItem value="operador">{roleLabels.operador}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={user.is_active ? 'secondary' : 'outline'}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!isSelf && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={update.isPending}
                          aria-label={`${user.is_active ? 'Desactivar' : 'Activar'} a ${user.full_name}`}
                          title={user.is_active ? 'Desactivar' : 'Activar'}
                          onClick={() =>
                            user.is_active
                              ? setPending({ kind: 'deactivate', user })
                              : update.mutate({ id: user.id, is_active: true })
                          }
                        >
                          {user.is_active ? <UserX /> : <UserCheck />}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.kind === 'role' ? '¿Cambiar rol?' : '¿Desactivar usuario?'}
        description={
          pending?.kind === 'role'
            ? pending.role === 'admin'
              ? `${pending.user.full_name} podrá editar productos y categorías, ajustar inventario, anular ventas y administrar usuarios y configuración.`
              : `${pending.user.full_name} solo podrá registrar ventas y entradas o salidas de mercancía, y consultar la información.`
            : pending
              ? `${pending.user.full_name} no podrá entrar al sistema. Su historial se conserva y puedes reactivarlo cuando quieras.`
              : ''
        }
        confirmLabel={pending?.kind === 'role' ? 'Cambiar rol' : 'Desactivar'}
        destructive={pending?.kind === 'deactivate'}
        loading={update.isPending}
        onConfirm={confirm}
      />
    </div>
  )
}
