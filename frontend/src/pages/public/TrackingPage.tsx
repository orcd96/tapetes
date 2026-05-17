import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { trackOrder } from '../../api/endpoints'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { orderStatusBadge, paymentStatusBadge } from '../../components/ui/Badge'
import type { ServiceOrder } from '../../types'
import { Search, Package } from 'lucide-react'

interface FormData {
  phone: string
  name: string
}

export function TrackingPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()
  const [orders, setOrders] = useState<ServiceOrder[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (data: FormData) => {
    setError('')
    setLoading(true)
    try {
      const { data: results } = await trackOrder(data.phone, data.name)
      setOrders(results)
      if (results.length === 0) setError('No encontramos órdenes con esos datos')
    } catch {
      setError('Error al buscar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n: string) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="mx-auto max-w-lg pt-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-700">RugSpa</h1>
          <p className="mt-1 text-gray-500">Seguimiento de tu orden</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Teléfono con el que agendaste"
              type="tel"
              placeholder="Ej: 8115551234"
              {...register('phone', { required: 'Requerido' })}
              error={errors.phone?.message}
            />
            <Input
              label="Tu nombre"
              placeholder="Ej: Juan Pérez"
              {...register('name', { required: 'Requerido' })}
              error={errors.name?.message}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={loading} size="lg" className="w-full">
              <Search size={16} />
              Buscar mi orden
            </Button>
          </form>
        </div>

        {orders && orders.length > 0 && (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-mono text-lg font-bold text-gray-900">{order.folio}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  {orderStatusBadge(order.status, order.status_display)}
                </div>

                <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
                  <Package size={14} />
                  <span>{order.rug_count} tapete{order.rug_count !== 1 ? 's' : ''}</span>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total</span>
                    <span className="font-semibold">{fmt(order.total_amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Pago</span>
                    {paymentStatusBadge(order.payment_status, order.payment_status_display)}
                  </div>
                </div>

                <StatusTimeline status={order.status} />
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-gray-400">
          <a href="/login" className="hover:underline">Acceso para colaboradores</a>
        </p>
      </div>
    </div>
  )
}

const STEPS = [
  { key: 'pickup_scheduled', label: 'Recolección agendada' },
  { key: 'picked_up', label: 'Tapetes recolectados' },
  { key: 'received_at_spa', label: 'Recibidos en SPA' },
  { key: 'washing', label: 'En lavado' },
  { key: 'ready', label: 'Listos para entrega' },
  { key: 'delivery_scheduled', label: 'Entrega agendada' },
  { key: 'delivered', label: 'Entregados' },
]

function StatusTimeline({ status }: { status: string }) {
  const currentIdx = STEPS.findIndex((s) => s.key === status)

  return (
    <div className="mt-4 space-y-2">
      {STEPS.map((step, idx) => {
        const done = idx < currentIdx
        const current = idx === currentIdx
        return (
          <div key={step.key} className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${done ? 'bg-blue-500' : current ? 'bg-blue-700 ring-2 ring-blue-200' : 'bg-gray-200'}`} />
            <span className={`text-sm ${current ? 'font-semibold text-blue-700' : done ? 'text-gray-400 line-through' : 'text-gray-300'}`}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
