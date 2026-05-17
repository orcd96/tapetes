import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, DollarSign } from 'lucide-react'
import { getPrices, createPrice } from '../../api/endpoints'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { useForm } from 'react-hook-form'

const FIBER_LABELS: Record<string, string> = {
  synthetic: 'Sintética',
  natural: 'Natural',
  mixed: 'Mixta',
}

export function PricesPage() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)

  const { data: prices = [] } = useQuery({
    queryKey: ['prices'],
    queryFn: () => getPrices().then((r) => Array.isArray(r.data) ? r.data : (r.data as any).results ?? []),
  })

  const groupedByFiber = prices.reduce((acc, p) => {
    if (!acc[p.fiber_type]) acc[p.fiber_type] = []
    acc[p.fiber_type].push(p)
    return acc
  }, {} as Record<string, typeof prices>)

  const fmt = (n: string) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign size={24} />
          Precios por m²
        </h1>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} />
          Nuevo precio
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {['synthetic', 'natural', 'mixed'].map((fiber) => {
          const latest = groupedByFiber[fiber]?.[0]
          return (
            <div key={fiber} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-1 font-semibold text-gray-900">{FIBER_LABELS[fiber]}</h2>
              {latest ? (
                <>
                  <p className="text-3xl font-bold text-blue-700">{fmt(latest.price_per_m2)}</p>
                  <p className="mt-1 text-xs text-gray-400">por m² · desde {latest.effective_from}</p>
                </>
              ) : (
                <p className="text-gray-400">Sin precio configurado</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Historial de precios</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {prices.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-6 py-3">
              <div>
                <span className="text-sm font-medium">{FIBER_LABELS[p.fiber_type]}</span>
                <span className="ml-2 text-xs text-gray-400">desde {p.effective_from}</span>
              </div>
              <span className="font-semibold text-gray-900">{fmt(p.price_per_m2)}/m²</span>
            </div>
          ))}
          {prices.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400">Sin precios configurados</div>
          )}
        </div>
      </div>

      <NewPriceModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => { setShowNew(false); qc.invalidateQueries({ queryKey: ['prices'] }) }}
      />
    </div>
  )
}

function NewPriceModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { register, handleSubmit } = useForm({ defaultValues: { fiber_type: 'synthetic', price_per_m2: '', effective_from: new Date().toISOString().slice(0, 10) } })

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof createPrice>[0]) => createPrice(data).then((r) => r.data),
    onSuccess: onCreated,
  })

  return (
    <Modal open={open} onClose={onClose} title="Nuevo precio" size="sm">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d as Parameters<typeof createPrice>[0]))} className="flex flex-col gap-4">
        <Select label="Tipo de fibra" {...register('fiber_type')} options={[
          { value: 'synthetic', label: 'Sintética' },
          { value: 'natural', label: 'Natural' },
          { value: 'mixed', label: 'Mixta' },
        ]} />
        <Input label="Precio por m² ($)" type="number" step="0.01" {...register('price_per_m2', { required: true })} />
        <Input label="Vigente desde" type="date" {...register('effective_from')} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>Guardar</Button>
        </div>
      </form>
    </Modal>
  )
}
