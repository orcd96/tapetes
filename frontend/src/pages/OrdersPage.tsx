import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, ChevronRight } from 'lucide-react'
import { getOrders, createOrder, getClients, createClient } from '../api/endpoints'
import { useAuthStore } from '../stores/auth'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { orderStatusBadge, paymentStatusBadge } from '../components/ui/Badge'
import { useForm } from 'react-hook-form'
import type { ServiceOrder } from '../types'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pickup_scheduled', label: 'Recolección Agendada' },
  { value: 'picked_up', label: 'Recolectado' },
  { value: 'received_at_spa', label: 'En SPA' },
  { value: 'washing', label: 'En Lavado' },
  { value: 'ready', label: 'Listo' },
  { value: 'delivery_scheduled', label: 'Entrega Agendada' },
  { value: 'delivered', label: 'Entregado' },
]

export function OrdersPage() {
  const { hasRole } = useAuthStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showNew, setShowNew] = useState(false)
  const qc = useQueryClient()

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', statusFilter, search],
    queryFn: () =>
      getOrders({
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search }),
      }).then((r) => r.data),
  })

  const fmt = (n: string) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n))

  const canCreate = hasRole('admin', 'agent', 'manager')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Órdenes</h1>
        {canCreate && (
          <Button onClick={() => setShowNew(true)}>
            <Plus size={16} />
            Nueva orden
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar por folio, cliente, teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Cargando órdenes...</div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center text-gray-400">No hay órdenes</div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-gray-900">{order.folio}</span>
                  {orderStatusBadge(order.status, order.status_display)}
                  {paymentStatusBadge(order.payment_status, order.payment_status_display)}
                </div>
                <span className="text-sm text-gray-600">{order.client_name} · {order.client_phone}</span>
                <span className="text-xs text-gray-400">
                  {order.rug_count} tapete{order.rug_count !== 1 ? 's' : ''} ·{' '}
                  {new Date(order.created_at).toLocaleDateString('es-MX')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">{fmt(order.total_amount)}</span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <NewOrderModal open={showNew} onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); qc.invalidateQueries({ queryKey: ['orders'] }) }} />
    </div>
  )
}

interface NewOrderModalProps {
  open: boolean
  onClose: () => void
  onCreated: (order: ServiceOrder) => void
}

interface NewOrderForm {
  client_search: string
  client_id: string
  new_client_name: string
  new_client_phone: string
  new_client_address: string
  pickup_address: string
  origin: string
  notes: string
}

function NewOrderModal({ open, onClose, onCreated }: NewOrderModalProps) {
  const { register, handleSubmit } = useForm<NewOrderForm>({
    defaultValues: { origin: 'agent_scheduled' }
  })
  const [clientSearch, setClientSearch] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [selectedClient, setSelectedClient] = useState<{ id: number; name: string; phone: string; default_address: string } | null>(null)

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-search', clientSearch],
    queryFn: () => getClients(clientSearch).then((r) => r.data),
    enabled: clientSearch.length > 1,
  })

  const createOrderMutation = useMutation({
    mutationFn: (data: Partial<ServiceOrder>) => createOrder(data).then((r) => r.data),
    onSuccess: onCreated,
  })

  const createClientMutation = useMutation({
    mutationFn: (data: Parameters<typeof createClient>[0]) => createClient(data).then((r) => r.data),
  })

  const onSubmit = async (data: NewOrderForm) => {
    let clientId = selectedClient?.id
    if (showNewClient && !clientId) {
      const client = await createClientMutation.mutateAsync({
        name: data.new_client_name,
        phone: data.new_client_phone,
        default_address: data.new_client_address,
      })
      clientId = client.id
    }
    if (!clientId) return
    createOrderMutation.mutate({
      client: clientId,
      pickup_address: data.pickup_address || selectedClient?.default_address || '',
      origin: data.origin as ServiceOrder['origin'],
      notes: data.notes,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva orden de servicio" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Cliente</label>
          {selectedClient ? (
            <div className="flex items-center justify-between rounded-lg border border-blue-300 bg-blue-50 px-3 py-2">
              <div>
                <p className="text-sm font-medium">{selectedClient.name}</p>
                <p className="text-xs text-gray-500">{selectedClient.phone}</p>
              </div>
              <button type="button" onClick={() => setSelectedClient(null)} className="text-xs text-red-500">
                Cambiar
              </button>
            </div>
          ) : !showNewClient ? (
            <div className="space-y-2">
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Buscar cliente por nombre o teléfono..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
              {clients.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                  {clients.slice(0, 5).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSelectedClient(c); setClientSearch('') }}
                      className="flex w-full flex-col px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className="text-xs text-gray-400">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => setShowNewClient(true)} className="text-sm text-blue-600 hover:underline">
                + Registrar cliente nuevo
              </button>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-gray-200 p-3">
              <Input label="Nombre completo" {...register('new_client_name', { required: true })} />
              <Input label="Teléfono" {...register('new_client_phone', { required: true })} />
              <Input label="Dirección" {...register('new_client_address')} />
              <button type="button" onClick={() => setShowNewClient(false)} className="text-xs text-gray-500 hover:underline">
                ← Buscar cliente existente
              </button>
            </div>
          )}
        </div>

        <Input label="Dirección de recolección" {...register('pickup_address')} placeholder="Dejar vacío para usar dirección del cliente" />

        <Select
          label="Origen"
          {...register('origin')}
          options={[
            { value: 'agent_scheduled', label: 'Agendado por agente' },
            { value: 'technician_walkin', label: 'Tapete de técnico' },
            { value: 'direct', label: 'Directo / walk-in' },
          ]}
        />

        <Textarea label="Notas" {...register('notes')} rows={2} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={createOrderMutation.isPending}>Crear orden</Button>
        </div>
      </form>
    </Modal>
  )
}
