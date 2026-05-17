import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, getOrderRugs, updateRugStatus, getUsers } from '../../api/endpoints'
import { rugStatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ShowerHead } from 'lucide-react'
import type { Rug } from '../../types'
import { useState } from 'react'

const COLUMNS: { status: Rug['status']; label: string; color: string }[] = [
  { status: 'received', label: 'Recibidos', color: 'border-t-blue-500' },
  { status: 'washing', label: 'En Lavado', color: 'border-t-yellow-500' },
  { status: 'ready', label: 'Listos', color: 'border-t-green-500' },
]

export function SpaBoard() {
  const { data: orders = [] } = useQuery({
    queryKey: ['orders', 'active'],
    queryFn: () =>
      getOrders({ status: 'received_at_spa,washing,ready' }).then((r) => r.data),
    refetchInterval: 20000,
  })

  const { data: washers = [] } = useQuery({
    queryKey: ['users-washers'],
    queryFn: () => getUsers().then((r) => r.data.filter((u) => u.role === 'washer')),
  })

  const allOrderIds = orders.map((o) => o.id)

  const rugQueries = useQuery({
    queryKey: ['all-active-rugs', allOrderIds],
    queryFn: async () => {
      const results = await Promise.all(orders.map((o) => getOrderRugs(o.id).then((r) => r.data)))
      return results.flat()
    },
    enabled: orders.length > 0,
  })

  const rugs = rugQueries.data ?? []
  const qc = useQueryClient()

  const rugsByStatus: Record<string, Rug[]> = {
    received: rugs.filter((r) => r.status === 'received'),
    washing: rugs.filter((r) => r.status === 'washing'),
    ready: rugs.filter((r) => r.status === 'ready'),
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <ShowerHead size={24} />
        Tablero SPA
      </h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <div key={col.status} className={`rounded-xl border border-gray-200 border-t-4 bg-white shadow-sm ${col.color}`}>
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-900">{col.label}</h2>
              <p className="text-xs text-gray-400">{rugsByStatus[col.status]?.length ?? 0} tapetes</p>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto p-3">
              {(rugsByStatus[col.status] ?? []).map((rug) => (
                <RugCard key={rug.id} rug={rug} washers={washers} onUpdated={() => qc.invalidateQueries({ queryKey: ['all-active-rugs'] })} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RugCard({ rug, washers, onUpdated }: { rug: Rug; washers: { id: number; first_name: string; last_name: string; username: string }[]; onUpdated: () => void }) {
  const [assigning, setAssigning] = useState(false)

  const mutation = useMutation({
    mutationFn: (data: { status?: string; assigned_washer?: number | null }) =>
      updateRugStatus(rug.id, { status: data.status ?? rug.status, assigned_washer: data.assigned_washer }),
    onSuccess: onUpdated,
  })

  const nextStatus = rug.status === 'received' ? 'washing' : rug.status === 'washing' ? 'ready' : null
  const nextLabel = nextStatus === 'washing' ? '→ Lavado' : nextStatus === 'ready' ? '→ Listo' : null

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Tapete {rug.index}</p>
          <p className="text-xs text-gray-500">{rug.width_cm}×{rug.height_cm}cm · {rug.fiber_type_display}</p>
          {rug.assigned_washer_name && (
            <p className="text-xs text-blue-600">👤 {rug.assigned_washer_name}</p>
          )}
        </div>
        {rugStatusBadge(rug.status, rug.status_display)}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {!rug.assigned_washer && washers.length > 0 && (
          assigning ? (
            <select
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
              onChange={(e) => {
                mutation.mutate({ assigned_washer: Number(e.target.value) })
                setAssigning(false)
              }}
              defaultValue=""
            >
              <option value="" disabled>Seleccionar lavador</option>
              {washers.map((w) => (
                <option key={w.id} value={w.id}>{w.first_name || w.username}</option>
              ))}
            </select>
          ) : (
            <button onClick={() => setAssigning(true)} className="text-xs text-blue-600 hover:underline">
              Asignar lavador
            </button>
          )
        )}

        {nextLabel && (
          <Button
            size="sm"
            variant="secondary"
            loading={mutation.isPending}
            onClick={() => mutation.mutate({ status: nextStatus! })}
          >
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
