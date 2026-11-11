import { Banknote, CircleCheck, CircleSlash, Package, ShoppingCart, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/state-message'
import { useCurrentUser } from '@/features/auth/auth-context'
import { formatCOP } from '@/lib/format'
import { RecentActivity } from '../components/recent-activity'
import { StatCard } from '../components/stat-card'
import { useDashboardSummary } from '../hooks/use-dashboard'

export function DashboardPage() {
  const user = useCurrentUser()
  const summary = useDashboardSummary()
  const data = summary.data
  const firstName = user.full_name.split(' ')[0]

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title={`Hola, ${firstName}`} description="Este es el estado del negocio hoy." />

      {summary.isError ? (
        <div className="rounded-lg border">
          <ErrorState message={summary.error.message} onRetry={() => void summary.refetch()} />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Ventas de hoy"
              value={data?.sales_today_count}
              icon={ShoppingCart}
              hint="Ventas completadas"
            />
            <StatCard
              label="Ingresos de hoy"
              value={data && formatCOP(data.sales_today_revenue)}
              icon={Banknote}
              hint="Pesos colombianos"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Productos registrados"
              value={data?.total_products}
              icon={Package}
              hint={data && data.inactive_products > 0 ? `${data.inactive_products} inactivos` : undefined}
            />
            <StatCard label="Disponibles" value={data?.available_products} icon={CircleCheck} hint="Con existencias" />
            <StatCard
              label="Bajo inventario"
              value={data?.low_stock_products}
              icon={TriangleAlert}
              tone={data && data.low_stock_products > 0 ? 'warning' : 'default'}
              hint="En el mínimo o por debajo"
            />
            <StatCard
              label="Agotados"
              value={data?.out_of_stock_products}
              icon={CircleSlash}
              tone={data && data.out_of_stock_products > 0 ? 'danger' : 'default'}
              hint="Sin existencias"
            />
          </div>
        </>
      )}

      <RecentActivity />
    </div>
  )
}
