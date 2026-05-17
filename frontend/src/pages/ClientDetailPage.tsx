import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit2, ChevronRight, MapPin, Plus, Star, Trash2 } from 'lucide-react'
import {
  getClient, updateClient, getClientOrders,
  getClientAddresses, createClientAddress, updateClientAddress, deleteClientAddress,
} from '../api/endpoints'
import { useAuthStore } from '../stores/auth'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { orderStatusBadge, paymentStatusBadge } from '../components/ui/Badge'
import { useForm } from 'react-hook-form'
import type { Client, ClientAddress } from '../types'

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const clientId = Number(id)
  const navigate = useNavigate()
  const { hasRole } = useAuthStore()
  const qc = useQueryClient()
  const [showEdit, setShowEdit] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [editingAddress, setEditingAddress] = useState<ClientAddress | null>(null)

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

  const { data: addresses = [] } = useQuery({
    queryKey: ['client-addresses', clientId],
    queryFn: () => getClientAddresses(clientId).then((r) => {
      const d = r.data as any
      return Array.isArray(d) ? d : d.results ?? []
    }),
  })

  const deleteAddressMutation = useMutation({
    mutationFn: (addrId: number) => deleteClientAddress(clientId, addrId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-addresses', clientId] }),
  })

  const setDefaultMutation = useMutation({
    mutationFn: (addrId: number) => updateClientAddress(clientId, addrId, { is_default: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-addresses', clientId] }),
  })

  if (isLoading || !client) {
    return <div className="py-12 text-center text-gray-400">Cargando...</div>
  }

  const fmt = (n: string | number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n))

  const canEdit = hasRole('admin', 'agent', 'manager')

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
        {canEdit && (
          <Button size="sm" variant="secondary" onClick={() => setShowEdit(true)}>
            <Edit2 size={14} />
            Editar
          </Button>
        )}
      </div>

      {/* Información general */}
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

      {/* Domicilios guardados */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            <MapPin size={16} className="mr-1 inline text-blue-500" />
            Domicilios ({addresses.length})
          </h2>
          {canEdit && (
            <Button size="sm" variant="secondary" onClick={() => setShowAddAddress(true)}>
              <Plus size={14} />
              Agregar
            </Button>
          )}
        </div>

        {addresses.length === 0 ? (
          <p className="text-sm text-gray-400">Sin domicilios guardados.</p>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr: ClientAddress) => (
              <div
                key={addr.id}
                className={`flex items-start justify-between rounded-lg border px-4 py-3 ${
                  addr.is_default ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex-1 text-sm">
                  <div className="flex items-center gap-2">
                    {addr.label && <span className="font-medium text-gray-700">{addr.label}</span>}
                    {addr.is_default && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                        <Star size={10} /> Principal
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-gray-600">{addr.address}</p>
                </div>
                {canEdit && (
                  <div className="ml-3 flex items-center gap-2">
                    {!addr.is_default && (
                      <button
                        onClick={() => setDefaultMutation.mutate(addr.id)}
                        className="text-xs text-blue-600 hover:underline"
                        title="Marcar como principal"
                      >
                        <Star size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingAddress(addr)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar este domicilio?')) {
                          deleteAddressMutation.mutate(addr.id)
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de órdenes */}
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

      {showAddAddress && (
        <AddressModal
          clientId={clientId}
          onClose={() => setShowAddAddress(false)}
          onSaved={() => {
            setShowAddAddress(false)
            qc.invalidateQueries({ queryKey: ['client-addresses', clientId] })
          }}
        />
      )}

      {editingAddress && (
        <AddressModal
          clientId={clientId}
          address={editingAddress}
          onClose={() => setEditingAddress(null)}
          onSaved={() => {
            setEditingAddress(null)
            qc.invalidateQueries({ queryKey: ['client-addresses', clientId] })
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
        <Input label="Dirección principal" {...register('default_address')} />
        <Textarea label="Notas" {...register('notes')} rows={2} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>Guardar</Button>
        </div>
      </form>
    </Modal>
  )
}

function AddressModal({
  clientId,
  address,
  onClose,
  onSaved,
}: {
  clientId: number
  address?: ClientAddress
  onClose: () => void
  onSaved: () => void
}) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      label: address?.label ?? '',
      address: address?.address ?? '',
      is_default: address?.is_default ?? false,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: Partial<ClientAddress>) =>
      address
        ? updateClientAddress(clientId, address.id, data)
        : createClientAddress(clientId, data),
    onSuccess: onSaved,
  })

  return (
    <Modal open onClose={onClose} title={address ? 'Editar domicilio' : 'Agregar domicilio'}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
        <Input label="Etiqueta (opcional)" placeholder="Ej: Casa, Oficina, Bodega" {...register('label')} />
        <Textarea label="Dirección completa" {...register('address', { required: true })} rows={3}
          placeholder="Calle, número, colonia, ciudad..." />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" {...register('is_default')} className="rounded" />
          Marcar como domicilio principal
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>
            {address ? 'Guardar' : 'Agregar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
