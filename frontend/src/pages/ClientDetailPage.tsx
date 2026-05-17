import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit2, ChevronRight } from 'lucide-react'
import { getClient, updateClient, getClientOrders } from '../api/endpoints'
import { useAuthStore } from '../stores/auth'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { orderStatusBadge, paymentStatusBadge } from '../components/ui/Badge'
import { useForm } from 'react-hook-form'
import type { Client } from '../types'

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const clientId = Number(id)
  const navigate = useNavigate()
  const { hasRole } = useAuthStore()
  const qc = useQueryClient()
  const [showEdit, setShowEdit] = useState(false)

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => getClient(clientId).then((r) => r.data),
  })

  const { data: orders = [] } = useQuery({
    queryKey: ['client-orders', clientId],
    queryFn: () => getClientOrders(clientId).then((r) => {
      const d = r.data as any
      return Array.isArray(d) ? d : d.results ?? []
    }),
  })

  if (isLoading || !client) {
    return <div className="py-12 text-center text-gray-400">Cargando...</div>
  }

  const fmt = (n: string | number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-sm text-gray-500">{client.phone}</p>
        </div>
        {hasRole('admin', 'agent', 'manager') && (
          <Button size="sm" variant="secondary" onClick={() => setShowEdit(true)}>
            <Edit2 size={14} />
            Editar
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">Información</h2>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="w-28 shrink-0 text-gray-500">Teléfono</span>
            <a href={`tel:${client.phone}`} className="text-blue-600">{client.phone}</a>
          </div>
          {client.email && (
            <div className="flex gap-2">
              <span className="w-28 shrink-0 text-gray-500">Email</span>
              <a href={`mailto:${client.email}`} className="text-blue-600">{client.email}</a>
            </div>
          )}
          {client.default_address && (
            <div className="flex gap-2">
              <span className="w-28 shrink-0 text-gray-500">Dirección</span>
              <span className="text-gray-900">{client.default_address}</span>
            </div>
          )}
          {client.notes && (
            <div className="flex gap-2">
              <span className="w-28 shrink-0 text-gray-500">Notas</span>
              <span className="text-gray-900">{client.notes}</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-gray-900">
          Historial de órdenes ({orders.length})
        </h2>
        {orders.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center text-gray-400">
            Sin órdenes registradas
          </div>
        ) : (
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
            {orders.map((order: any) => (
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
      </div>

      {showEdit && client && (
        <EditClientModal
          client={client}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false)
            qc.invalidateQueries({ queryKey: ['client', clientId] })
            qc.invalidateQueries({ queryKey: ['clients'] })
          }}
        />
      )}
    </div>
  )
}

function EditClientModal({ client, onClose, onSaved }: { client: Client; onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: client.name,
      phone: client.phone,
      email: client.email,
      default_address: client.default_address,
      notes: client.notes,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: Partial<Client>) => updateClient(client.id, data),
    onSuccess: onSaved,
  })

  return (
    <Modal open onClose={onClose} title="Editar cliente">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
        <Input label="Nombre completo" {...register('name', { required: true })} />
        <Input label="Teléfono" {...register('phone', { required: true })} />
        <Input label="Email" type="email" {...register('email')} />
        <Input label="Dirección" {...register('default_address')} />
        <Textarea label="Notas" {...register('notes')} rows={2} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>Guardar</Button>
        </div>
      </form>
    </Modal>
  )
}
