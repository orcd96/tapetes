import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, Package, Truck, DollarSign, Clock } from 'lucide-react'
import { getDashboard } from '../../api/endpoints'
import { StatCard } from '../../components/ui/Card'

const statusLabels: Record<string, string> = {
  pickup_scheduled: 'Recolección Agendada',
  picked_up: 'Recolectado',
  received_at_spa: 'En SPA',
  washing: 'En Lavado',
  ready: 'Listo',
  delivery_scheduled: 'Entrega Agendada',
  delivered: 'Entregado',
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboard().then((r) => r.data),
    refetchInterval: 30000,
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-400">Cargando...</div>
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <LayoutDashboard size={24} />
        Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Órdenes hoy"
          value={data?.orders_today ?? 0}
          icon={<Package size={20} />}
          color="blue"
        />
        <StatCard
          label="Tapetes en proceso"
          value={data?.rugs_in_process ?? 0}
          icon={<Clock size={20} />}
          color="yellow"
        />
        <StatCard
          label="Tapetes listos"
          value={data?.rugs_ready ?? 0}
          icon={<Truck size={20} />}
          color="green"
        />
        <StatCard
          label="Ingreso hoy"
          value={fmt(data?.income_today ?? 0)}
          sub={`Mes: ${fmt(data?.income_month ?? 0)}`}
          icon={<DollarSign size={20} />}
          color="green"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Estado de órdenes</h2>
          <div className="space-y-3">
            {Object.entries(data?.orders_by_status ?? {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{statusLabels[status] ?? status}</span>
                <span className="text-sm font-semibold text-gray-900">{count as number}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Pagos</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Ingreso del mes</span>
              <span className="font-semibold text-green-700">{fmt(data?.income_month ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pendiente de cobro</span>
              <span className="font-semibold text-red-600">{fmt(data?.pending_payment_total ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Órdenes del mes</span>
              <span className="font-semibold text-gray-900">{data?.orders_month ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
