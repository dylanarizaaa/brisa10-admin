import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/state-message'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCurrentUser } from '@/features/auth/auth-context'
import { AccountForm } from '../components/account-form'
import { BusinessForm } from '../components/business-form'
import { UsersPanel } from '../components/users-panel'
import { useBusinessSettings } from '../hooks/use-settings'

export function SettingsPage() {
  const { isAdmin } = useCurrentUser()
  const settings = useBusinessSettings()

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title="Configuración" description="Información del negocio, usuarios y preferencias." />

      <Tabs defaultValue="negocio" className="gap-6">
        <TabsList>
          <TabsTrigger value="negocio">Negocio</TabsTrigger>
          {isAdmin && <TabsTrigger value="usuarios">Usuarios</TabsTrigger>}
          <TabsTrigger value="cuenta">Mi cuenta</TabsTrigger>
        </TabsList>

        <TabsContent value="negocio">
          {settings.isPending ? (
            <div className="flex max-w-2xl flex-col gap-4" role="status" aria-label="Cargando configuración">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-2/3" />
            </div>
          ) : settings.isError ? (
            <div className="rounded-lg border">
              <ErrorState message={settings.error.message} onRetry={() => void settings.refetch()} />
            </div>
          ) : (
            <BusinessForm settings={settings.data} canEdit={isAdmin} />
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="usuarios">
            <UsersPanel />
          </TabsContent>
        )}

        <TabsContent value="cuenta">
          <AccountForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
