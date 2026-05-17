import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronRight, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getClients } from '../api/endpoints'

export function ClientsPage() {
  const [search, setSearch] = useState('')

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => getClients(search).then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Users size={24} />
        Clientes
      </h1>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar por nombre, teléfono, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Cargando...</div>
      ) : clients.length === 0 ? (
        <div className="py-12 text-center text-gray-400">No se encontraron clientes</div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
          {clients.map((client) => (
            <Link
              key={client.id}
              to={`/clients/${client.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-900">{client.name}</p>
                <p className="text-sm text-gray-500">{client.phone}</p>
                {client.default_address && (
                  <p className="text-xs text-gray-400 truncate max-w-xs">{client.default_address}</p>
                )}
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
