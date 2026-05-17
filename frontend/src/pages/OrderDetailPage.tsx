import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Camera, Truck, Package } from 'lucide-react'
import {
  getOrder, getOrderRugs, updateOrderStatus,
  getOrderPayments, createPayment, createRug,
  updateRugStatus, uploadRugPhoto, createPickup, createDelivery, getDrivers
} from '../api/endpoints'
import { useAuthStore } from '../stores/auth'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { orderStatusBadge, paymentStatusBadge, rugStatusBadge } from '../components/ui/Badge'
import { useForm } from 'react-hook-form'
import type { Rug, User } from '../types'

const ORDER_STATUS_FLOW = [
  'pickup_scheduled', 'picked_up', 'received_at_spa',
  'washing', 'ready', 'delivery_scheduled', 'delivered',
] as const

const STATUS_LABELS: Record<string, string> = {
  pickup_scheduled: 'Recolección Agendada',
  picked_up: 'Recolectado',
  received_at_spa: 'Recibido en SPA',
  washing: 'En Lavado',
  ready: 'Listo para Entregar',
  delivery_scheduled: 'Entrega Agendada',
  delivered: 'Entregado',
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const orderId = Number(id)
  const navigate = useNavigate()
  const { hasRole } = useAuthStore()
  const qc = useQueryClient()
  const [showAddRug, setShowAddRug] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [showSchedulePickup, setShowSchedulePickup] = useState(false)
  const [showScheduleDelivery, setShowScheduleDelivery] = useState(false)
  const [selectedRug, setSelectedRug] = useState<Rug | null>(null)

  const { data: order, isLoading: loadingOrder } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId).then((r) => r.data),
  })

  const { data: rugs = [] } = useQuery({
    queryKey: ['order-rugs', orderId],
    queryFn: () => getOrderRugs(orderId).then((r) => {
      const d = r.data as any
      return Array.isArray(d) ? d : d.results ?? []
    }),
  })

  const { data: payments = [] } = useQuery({
    queryKey: ['order-payments', orderId],
    queryFn: () => getOrderPayments(orderId).then((r) => {
      const d = r.data as any
      return Array.isArray(d) ? d : d.results ?? []
    }),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateOrderStatus(orderId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order', orderId] }),
  })

  const fmt = (n: string | number | undefined) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n ?? 0))

  if (loadingOrder || !order) {
    return <div className="py-12 text-center text-gray-400">Cargando...</div>
  }

  const currentStatusIdx = ORDER_STATUS_FLOW.indexOf(order.status as typeof ORDER_STATUS_FLOW[number])
  const nextStatus = ORDER_STATUS_FLOW[currentStatusIdx + 1]

  const canManageRugs = hasRole('admin', 'manager')
  const canChangeStatus = hasRole('admin', 'manager', 'agent')
  const canAddPayment = hasRole('admin', 'manager', 'agent', 'driver')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl font-bold text-gray-900">{order.folio}</h1>
            {orderStatusBadge(order.status, order.status_display)}
            {paymentStatusBadge(order.payment_status, order.payment_status_display)}
          </div>
          <p className="text-sm text-gray-500">
            {order.client_name} · {order.client_phone}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="mb-3 font-semibold text-gray-900">Información</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">Dirección: </span>{order.pickup_address}</div>
            <div><span className="text-gray-500">Creada: </span>{new Date(order.created_at).toLocaleDateString('es-MX')}</div>
            {order.notes && <div><span className="text-gray-500">Notas: </span>{order.notes}</div>}
          </div>

          {canChangeStatus && order.status === 'pickup_scheduled' && (
            <Button
              className="mt-4 w-full"
              variant="secondary"
              onClick={() => setShowSchedulePickup(true)}
            >
              <Truck size={14} />
              Agendar recolección
            </Button>
          )}
          {canChangeStatus && nextStatus && order.status !== 'pickup_scheduled' && (
            <Button
              className="mt-4 w-full"
              onClick={() => {
                if (nextStatus === 'delivery_scheduled') {
                  setShowScheduleDelivery(true)
                } else {
                  statusMutation.mutate(nextStatus)
                }
              }}
              loading={statusMutation.isPending}
            >
              {nextStatus === 'delivery_scheduled' ? <Package size={14} /> : null}
              → {STATUS_LABELS[nextStatus]}
            </Button>
          )}
        </div>

        {/* Tapetes */}
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Tapetes ({rugs.length})</h2>
            {canManageRugs && (
              <Button size="sm" onClick={() => setShowAddRug(true)}>
                <Plus size={14} />
                Agregar tapete
              </Button>
            )}
          </div>

          {rugs.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center text-gray-400">
              No hay tapetes registrados
            </div>
          ) : (
            <div className="space-y-2">
              {rugs.map((rug) => (
                <div
                  key={rug.id}
                  onClick={() => setSelectedRug(rug)}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-300"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Tapete {rug.index}</span>
                        {rugStatusBadge(rug.status, rug.status_display)}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {rug.width_cm}×{rug.height_cm}cm · {rug.area_m2}m² · {rug.fiber_type_display}
                      </p>
                      {rug.assigned_washer_name && (
                        <p className="text-xs text-blue-600">Lavador: {rug.assigned_washer_name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-700">{fmt(rug.total)}</p>
                      <div className="flex gap-1 mt-1">
                        {rug.photos.slice(0, 3).map((p) => (
                          <img key={p.id} src={p.file} alt={p.photo_type} className="h-8 w-8 rounded object-cover" />
                        ))}
                        {rug.photos.length === 0 && (
                          <span className="text-xs text-gray-400 flex items-center gap-1"><Camera size={12} />Sin fotos</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagos */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Pagos</h2>
          {canAddPayment && (
            <Button size="sm" variant="secondary" onClick={() => setShowAddPayment(true)}>
              <Plus size={14} />
              Registrar pago
            </Button>
          )}
        </div>
        <div className="mb-3 flex justify-between text-sm">
          <span className="text-gray-500">Total</span>
          <span className="font-semibold">{fmt(order.total_amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Pagado</span>
          <span className="font-semibold text-green-700">{fmt(order.amount_paid)}</span>
        </div>
        {Number(order.total_amount) - Number(order.amount_paid) > 0 && (
          <div className="mt-2 flex justify-between text-sm font-semibold">
            <span className="text-red-600">Pendiente</span>
            <span className="text-red-600">
              {fmt(Number(order.total_amount) - Number(order.amount_paid))}
            </span>
          </div>
        )}
        {payments.length > 0 && (
          <div className="mt-4 space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex justify-between text-xs text-gray-500">
                <span>{p.method_display} · {p.stage_display}</span>
                <span className="font-medium text-gray-700">{fmt(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <SchedulePickupModal
        open={showSchedulePickup}
        orderId={orderId}
        onClose={() => setShowSchedulePickup(false)}
        onCreated={() => {
          setShowSchedulePickup(false)
          qc.invalidateQueries({ queryKey: ['order', orderId] })
        }}
      />

      <ScheduleDeliveryModal
        open={showScheduleDelivery}
        orderId={orderId}
        onClose={() => setShowScheduleDelivery(false)}
        onCreated={() => {
          setShowScheduleDelivery(false)
          statusMutation.mutate('delivery_scheduled')
        }}
      />

      <AddRugModal
        open={showAddRug}
        orderId={orderId}
        onClose={() => setShowAddRug(false)}
        onCreated={() => { setShowAddRug(false); qc.invalidateQueries({ queryKey: ['order-rugs', orderId] }); qc.invalidateQueries({ queryKey: ['order', orderId] }) }}
      />

      <AddPaymentModal
        open={showAddPayment}
        orderId={orderId}
        onClose={() => setShowAddPayment(false)}
        onCreated={() => { setShowAddPayment(false); qc.invalidateQueries({ queryKey: ['order-payments', orderId] }); qc.invalidateQueries({ queryKey: ['order', orderId] }) }}
      />

      {selectedRug && (
        <RugDetailModal
          rug={selectedRug}
          onClose={() => { setSelectedRug(null); qc.invalidateQueries({ queryKey: ['order-rugs', orderId] }) }}
        />
      )}
    </div>
  )
}

function AddRugModal({ open, orderId, onClose, onCreated }: { open: boolean; orderId: number; onClose: () => void; onCreated: () => void }) {
  const { register, handleSubmit } = useForm({ defaultValues: { fiber_type: 'synthetic', width_cm: '', height_cm: '', condition_notes: '', odor_treatment: false, stain_protector: false } })

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof createRug>[1]) => createRug(orderId, data).then((r) => r.data),
    onSuccess: onCreated,
  })

  return (
    <Modal open={open} onClose={onClose} title="Agregar tapete">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d as Parameters<typeof createRug>[1]))} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Ancho (cm)" type="number" step="0.1" {...register('width_cm', { required: true })} />
          <Input label="Alto (cm)" type="number" step="0.1" {...register('height_cm', { required: true })} />
        </div>
        <Select label="Tipo de fibra" {...register('fiber_type')} options={[
          { value: 'synthetic', label: 'Sintética' },
          { value: 'natural', label: 'Natural' },
          { value: 'mixed', label: 'Mixta' },
        ]} />
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('odor_treatment')} /> Tratamiento de olores</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('stain_protector')} /> Protector antimanchas</label>
        </div>
        <Textarea label="Notas de condición" {...register('condition_notes')} rows={2} placeholder="Manchas, daños, color especial..." />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>Agregar</Button>
        </div>
      </form>
    </Modal>
  )
}

function AddPaymentModal({ open, orderId, onClose, onCreated }: { open: boolean; orderId: number; onClose: () => void; onCreated: () => void }) {
  const { register, handleSubmit } = useForm({ defaultValues: { amount: '', method: 'cash', stage: 'at_spa', notes: '' } })

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof createPayment>[1]) => createPayment(orderId, data).then((r) => r.data),
    onSuccess: onCreated,
  })

  return (
    <Modal open={open} onClose={onClose} title="Registrar pago">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d as Parameters<typeof createPayment>[1]))} className="flex flex-col gap-4">
        <Input label="Monto ($)" type="number" step="0.01" {...register('amount', { required: true })} />
        <Select label="Método de pago" {...register('method')} options={[
          { value: 'cash', label: 'Efectivo' },
          { value: 'transfer', label: 'Transferencia' },
          { value: 'card', label: 'Tarjeta' },
        ]} />
        <Select label="Etapa" {...register('stage')} options={[
          { value: 'at_scheduling', label: 'Al agendar' },
          { value: 'at_pickup', label: 'En recolección' },
          { value: 'at_spa', label: 'En el SPA' },
          { value: 'at_delivery', label: 'En entrega' },
        ]} />
        <Textarea label="Notas" {...register('notes')} rows={2} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>Registrar</Button>
        </div>
      </form>
    </Modal>
  )
}

function SchedulePickupModal({ open, orderId, onClose, onCreated }: { open: boolean; orderId: number; onClose: () => void; onCreated: () => void }) {
  const { register, handleSubmit } = useForm({ defaultValues: { scheduled_at: '', driver: '' } })

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => getDrivers().then((r) => {
      const d = r.data as any
      return (Array.isArray(d) ? d : d.results ?? []) as User[]
    }),
  })

  const mutation = useMutation({
    mutationFn: (data: { scheduled_at: string; driver: string }) =>
      createPickup({ service_order: orderId, scheduled_at: data.scheduled_at, driver: Number(data.driver) }),
    onSuccess: onCreated,
  })

  return (
    <Modal open={open} onClose={onClose} title="Agendar recolección">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
        <Input label="Fecha y hora" type="datetime-local" {...register('scheduled_at', { required: true })} />
        <Select label="Chofer asignado" {...register('driver', { required: true })} options={[
          { value: '', label: 'Seleccionar chofer...' },
          ...drivers.map((d) => ({ value: String(d.id), label: d.first_name ? `${d.first_name} ${d.last_name}` : d.username })),
        ]} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>Agendar</Button>
        </div>
      </form>
    </Modal>
  )
}

function ScheduleDeliveryModal({ open, orderId, onClose, onCreated }: { open: boolean; orderId: number; onClose: () => void; onCreated: () => void }) {
  const { register, handleSubmit } = useForm({ defaultValues: { scheduled_at: '', driver: '' } })

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => getDrivers().then((r) => {
      const d = r.data as any
      return (Array.isArray(d) ? d : d.results ?? []) as User[]
    }),
  })

  const mutation = useMutation({
    mutationFn: (data: { scheduled_at: string; driver: string }) =>
      createDelivery({ service_order: orderId, scheduled_at: data.scheduled_at, driver: Number(data.driver) }),
    onSuccess: onCreated,
  })

  return (
    <Modal open={open} onClose={onClose} title="Agendar entrega">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
        <Input label="Fecha y hora" type="datetime-local" {...register('scheduled_at', { required: true })} />
        <Select label="Chofer asignado" {...register('driver', { required: true })} options={[
          { value: '', label: 'Seleccionar chofer...' },
          ...drivers.map((d) => ({ value: String(d.id), label: d.first_name ? `${d.first_name} ${d.last_name}` : d.username })),
        ]} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>Agendar entrega</Button>
        </div>
      </form>
    </Modal>
  )
}

function RugDetailModal({ rug, onClose }: { rug: Rug; onClose: () => void }) {
  const { hasRole } = useAuthStore()
  const qc = useQueryClient()
  const [, setPhotoUploading] = useState(false)

  const statusMutation = useMutation({
    mutationFn: (data: { status: string }) => updateRugStatus(rug.id, data),
    onSuccess: onClose,
  })

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after' | 'damage') => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('photo_type', type)
    await uploadRugPhoto(rug.id, fd)
    setPhotoUploading(false)
    qc.invalidateQueries({ queryKey: ['order-rugs'] })
  }

  return (
    <Modal open onClose={onClose} title={`Tapete ${rug.index} — ${rug.fiber_type_display}`} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Medidas: </span>{rug.width_cm}×{rug.height_cm}cm</div>
          <div><span className="text-gray-500">Área: </span>{rug.area_m2}m²</div>
          <div><span className="text-gray-500">Precio/m²: </span>${rug.price_per_m2}</div>
          <div><span className="text-gray-500">Total: </span>${rug.total}</div>
          {rug.odor_treatment && <div className="text-blue-600">✓ Anti-olores (+${rug.odor_price})</div>}
          {rug.stain_protector && <div className="text-blue-600">✓ Anti-manchas (+${rug.stain_price})</div>}
        </div>
        {rug.condition_notes && (
          <div className="text-sm"><span className="font-medium">Condición: </span>{rug.condition_notes}</div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium">Fotos</p>
          <div className="flex flex-wrap gap-2">
            {rug.photos.map((p) => (
              <div key={p.id} className="relative">
                <img src={p.file} alt={p.photo_type} className="h-24 w-24 rounded-lg object-cover" />
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-xs text-white">
                  {p.photo_type === 'before' ? 'Antes' : p.photo_type === 'after' ? 'Después' : 'Daño'}
                </span>
              </div>
            ))}
          </div>
          {(hasRole('admin', 'manager', 'driver', 'washer')) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(['before', 'after', 'damage'] as const).map((type) => (
                <label key={type} className="cursor-pointer">
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhoto(e, type)} />
                  <span className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50">
                    <Camera size={12} />
                    {type === 'before' ? 'Foto antes' : type === 'after' ? 'Foto después' : 'Foto daño'}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {hasRole('admin', 'manager', 'washer') && rug.status !== 'delivered' && (
          <div className="flex gap-2">
            {rug.status === 'received' && (
              <Button size="sm" onClick={() => statusMutation.mutate({ status: 'washing' })}>
                → En Lavado
              </Button>
            )}
            {rug.status === 'washing' && (
              <Button size="sm" onClick={() => statusMutation.mutate({ status: 'ready' })}>
                → Listo
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
