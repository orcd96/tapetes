import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Package } from 'lucide-react'
import { getWasherRugs, updateRugStatus, uploadRugPhoto } from '../../api/endpoints'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { rugStatusBadge } from '../../components/ui/Badge'
import type { Rug } from '../../types'

export function WasherPage() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<Rug | null>(null)

  const { data: rugs = [], isLoading } = useQuery({
    queryKey: ['washer-rugs'],
    queryFn: () => getWasherRugs().then((r) => Array.isArray(r.data) ? r.data : (r.data as any).results ?? []),
    refetchInterval: 30000,
  })

  if (isLoading) return <div className="py-20 text-center text-gray-400">Cargando...</div>

  return (
    <div className="space-y-5 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Package size={24} />
        Mis Tapetes
      </h1>

      {rugs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
          <Package size={32} className="mx-auto mb-3 opacity-30" />
          <p>No tienes tapetes asignados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rugs.map((rug) => (
            <button
              key={rug.id}
              onClick={() => setSelected(rug)}
              className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm hover:border-blue-300 active:scale-[0.98]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Tapete {rug.index}</span>
                    {rugStatusBadge(rug.status, rug.status_display)}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {rug.width_cm}×{rug.height_cm}cm · {rug.area_m2}m² · {rug.fiber_type_display}
                  </p>
                  {rug.condition_notes && (
                    <p className="mt-1 text-xs text-orange-600">⚠ {rug.condition_notes}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {rug.photos.filter(p => p.photo_type === 'before').slice(0, 2).map((p) => (
                    <img key={p.id} src={p.file} className="h-12 w-12 rounded object-cover" alt="antes" />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <WasherRugModal
          rug={selected}
          onClose={() => { setSelected(null); qc.invalidateQueries({ queryKey: ['washer-rugs'] }) }}
        />
      )}
    </div>
  )
}

function WasherRugModal({ rug, onClose }: { rug: Rug; onClose: () => void }) {
  const [uploading, setUploading] = useState(false)
  const qc = useQueryClient()

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateRugStatus(rug.id, { status }),
    onSuccess: onClose,
  })

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('photo_type', 'after')
    await uploadRugPhoto(rug.id, fd)
    setUploading(false)
    qc.invalidateQueries({ queryKey: ['washer-rugs'] })
  }

  const beforePhotos = rug.photos.filter(p => p.photo_type === 'before')
  const afterPhotos = rug.photos.filter(p => p.photo_type === 'after')

  return (
    <Modal open onClose={onClose} title={`Tapete ${rug.index} — ${rug.fiber_type_display}`}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Medidas: </span>{rug.width_cm}×{rug.height_cm}cm</div>
          <div><span className="text-gray-500">Área: </span>{rug.area_m2}m²</div>
          {rug.odor_treatment && <div className="text-blue-600">✓ Anti-olores</div>}
          {rug.stain_protector && <div className="text-blue-600">✓ Anti-manchas</div>}
        </div>

        {rug.condition_notes && (
          <div className="rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
            <strong>Condición reportada: </strong>{rug.condition_notes}
          </div>
        )}

        {beforePhotos.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Fotos antes</p>
            <div className="flex flex-wrap gap-2">
              {beforePhotos.map((p) => (
                <img key={p.id} src={p.file} className="h-24 w-24 rounded-lg object-cover" alt="antes" />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Fotos después</p>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} disabled={uploading} />
              <span className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50">
                <Camera size={12} />
                {uploading ? 'Subiendo...' : 'Tomar foto'}
              </span>
            </label>
          </div>
          {afterPhotos.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {afterPhotos.map((p) => (
                <img key={p.id} src={p.file} className="h-24 w-24 rounded-lg object-cover" alt="después" />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Sin fotos del resultado aún</p>
          )}
        </div>

        <div className="flex gap-2">
          {rug.status === 'received' && (
            <Button onClick={() => statusMutation.mutate('washing')} loading={statusMutation.isPending}>
              → Comenzar lavado
            </Button>
          )}
          {rug.status === 'washing' && (
            <Button onClick={() => statusMutation.mutate('ready')} loading={statusMutation.isPending}>
              ✓ Marcar como listo
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
