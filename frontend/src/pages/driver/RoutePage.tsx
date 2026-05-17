import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Package, Camera, CheckCircle, Truck } from 'lucide-react'
import { getDriverRoute, updatePickup, updateDelivery, uploadRugPhoto, getOrderRugs } from '../../api/endpoints'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Input'
import type { Pickup, Delivery } from '../../types'

export function RoutePage() {
  const qc = useQueryClient()
  const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)

  const { data: route, isLoading } = useQuery({
    queryKey: ['driver-route'],
    queryFn: () => getDriverRoute().then((r) => r.data),
    refetchInterval: 60000,
  })

  const pickupMutation = useMutation({
    mutationFn: ({ id, status, failure_reason }: { id: number; status: string; failure_reason?: string }) =>
      updatePickup(id, { status: status as Pickup['status'], failure_reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['driver-route'] }); setSelectedPickup(null) },
  })

  const deliveryMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateDelivery(id, { status: status as Delivery['status'] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['driver-route'] }); setSelectedDelivery(null) },
  })

  if (isLoading) return <div className="py-20 text-center text-gray-400">Cargando ruta...</div>

  const pickups = route?.pickups ?? []
  const deliveries = route?.deliveries ?? []
  const total = pickups.length + deliveries.length

  return (
    <div className="space-y-5 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Truck size={24} />
          Mi Ruta
        </h1>
        <p className="text-sm text-gray-400">{total} paradas hoy</p>
      </div>

      {total === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
          <Truck size={32} className="mx-auto mb-3 opacity-30" />
          <p>No hay paradas para hoy</p>
        </div>
      )}

      {pickups.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <Package size={14} />
            Recolecciones ({pickups.length})
          </h2>
          <div className="space-y-3">
            {pickups.map((pickup) => (
              <button
                key={pickup.id}
                onClick={() => setSelectedPickup(pickup)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm hover:border-blue-300 active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{pickup.client_name}</p>
                    <p className="text-sm text-gray-500">{pickup.client_phone}</p>
                    <div className="mt-1 flex items-start gap-1 text-xs text-gray-400">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      <span>{pickup.pickup_address}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(pickup.scheduled_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <StatusPill status={pickup.status} />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {deliveries.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <CheckCircle size={14} />
            Entregas ({deliveries.length})
          </h2>
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <button
                key={delivery.id}
                onClick={() => setSelectedDelivery(delivery)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm hover:border-green-300 active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{delivery.client_name}</p>
                    <p className="text-sm text-gray-500">{delivery.client_phone}</p>
                    <div className="mt-1 flex items-start gap-1 text-xs text-gray-400">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      <span>{delivery.delivery_address || 'Sin dirección'}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{delivery.rug_count} tapetes</p>
                  </div>
                  <StatusPill status={delivery.status} />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedPickup && (
        <PickupModal
          pickup={selectedPickup}
          onClose={() => setSelectedPickup(null)}
          onConfirm={(status, failureReason) =>
            pickupMutation.mutate({ id: selectedPickup.id, status, failure_reason: failureReason })
          }
          loading={pickupMutation.isPending}
        />
      )}

      {selectedDelivery && (
        <DeliveryModal
          delivery={selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          onConfirm={(status) =>
            deliveryMutation.mutate({ id: selectedDelivery.id, status })
          }
          loading={deliveryMutation.isPending}
        />
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pendiente', cls: 'bg-gray-100 text-gray-600' },
    in_progress: { label: 'En camino', cls: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Completado', cls: 'bg-green-100 text-green-700' },
    failed: { label: 'Fallido', cls: 'bg-red-100 text-red-700' },
  }
  const c = cfg[status] ?? cfg.pending
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${c.cls}`}>{c.label}</span>
  )
}

function PickupModal({ pickup, onClose, onConfirm, loading }: {
  pickup: Pickup
  onClose: () => void
  onConfirm: (status: string, reason?: string) => void
  loading: boolean
}) {
  const [showFail, setShowFail] = useState(false)
  const [failReason, setFailReason] = useState('')
  const qc = useQueryClient()
  const [, setPhotoUploading] = useState(false)

  const { data: rugs = [] } = useQuery({
    queryKey: ['order-rugs', pickup.service_order],
    queryFn: () => getOrderRugs(pickup.service_order).then((r) => r.data),
  })

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>, rugId: number) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('photo_type', 'before')
    await uploadRugPhoto(rugId, fd)
    setPhotoUploading(false)
    qc.invalidateQueries({ queryKey: ['order-rugs', pickup.service_order] })
  }

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(pickup.pickup_address)}`

  return (
    <Modal open onClose={onClose} title="Detalle de recolección">
      <div className="space-y-4">
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Cliente: </span>{pickup.client_name}</p>
          <p><span className="font-medium">Teléfono: </span>
            <a href={`tel:${pickup.client_phone}`} className="text-blue-600">{pickup.client_phone}</a>
          </p>
          <p className="flex items-start gap-1">
            <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {pickup.pickup_address}
            </a>
          </p>
        </div>

        {rugs.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Fotos antes (por tapete)</p>
            {rugs.map((rug) => (
              <div key={rug.id} className="mb-2 flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <span className="text-sm">Tapete {rug.index}</span>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhoto(e, rug.id)} />
                  <span className="flex items-center gap-1 text-xs text-blue-600">
                    <Camera size={14} />
                    {rug.photos.some(p => p.photo_type === 'before') ? '✓ Foto subida' : 'Tomar foto'}
                  </span>
                </label>
              </div>
            ))}
          </div>
        )}

        {showFail ? (
          <div className="space-y-3">
            <Textarea label="Motivo del fallo" value={failReason} onChange={(e) => setFailReason(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowFail(false)}>Cancelar</Button>
              <Button variant="danger" loading={loading} onClick={() => onConfirm('failed', failReason)}>
                Reportar fallo
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowFail(true)}>No se pudo recoger</Button>
            {pickup.status === 'pending' && (
              <Button loading={loading} onClick={() => onConfirm('in_progress')}>
                Salir a recoger
              </Button>
            )}
            {pickup.status === 'in_progress' && (
              <Button loading={loading} onClick={() => onConfirm('completed')}>
                ✓ Confirmar recolección
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

function DeliveryModal({ delivery, onClose, onConfirm, loading }: {
  delivery: Delivery
  onClose: () => void
  onConfirm: (status: string) => void
  loading: boolean
}) {
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(delivery.delivery_address || delivery.client_name)}`

  return (
    <Modal open onClose={onClose} title="Detalle de entrega">
      <div className="space-y-4 text-sm">
        <div className="space-y-1">
          <p><span className="font-medium">Cliente: </span>{delivery.client_name}</p>
          <p><span className="font-medium">Teléfono: </span>
            <a href={`tel:${delivery.client_phone}`} className="text-blue-600">{delivery.client_phone}</a>
          </p>
          <p className="flex items-start gap-1">
            <MapPin size={14} className="mt-0.5 text-gray-400" />
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {delivery.delivery_address || 'Ver en Maps'}
            </a>
          </p>
          <p><span className="font-medium">Tapetes: </span>{delivery.rug_count}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          {delivery.status === 'pending' && (
            <Button loading={loading} onClick={() => onConfirm('in_progress')}>Salir a entregar</Button>
          )}
          {delivery.status === 'in_progress' && (
            <Button loading={loading} onClick={() => onConfirm('completed')}>✓ Confirmar entrega</Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
