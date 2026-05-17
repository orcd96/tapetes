import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Settings } from 'lucide-react'
import { getUsers, createUser, updateUser } from '../../api/endpoints'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { useForm } from 'react-hook-form'
import type { User } from '../../types'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  agent: 'Agente',
  manager: 'Encargado SPA',
  driver: 'Chofer',
  washer: 'Lavador',
}

const ROLE_COLORS: Record<string, 'blue' | 'purple' | 'orange' | 'green' | 'yellow'> = {
  admin: 'purple',
  agent: 'blue',
  manager: 'orange',
  driver: 'green',
  washer: 'yellow',
}

export function UsersPage() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers().then((r) => (Array.isArray(r.data) ? r.data : (r.data as { results: User[] }).results)),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => updateUser(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings size={24} />
          Usuarios
        </h1>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} />
          Nuevo usuario
        </Button>
      </div>

      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between px-6 py-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                </span>
                <Badge label={ROLE_LABELS[user.role] ?? user.role} color={ROLE_COLORS[user.role] ?? 'gray'} />
                {!user.is_active && <Badge label="Inactivo" color="red" />}
              </div>
              <p className="text-sm text-gray-500">{user.username} · {user.phone}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditing(user)}>Editar</Button>
              <Button
                size="sm"
                variant={user.is_active ? 'ghost' : 'secondary'}
                onClick={() => toggleMutation.mutate({ id: user.id, is_active: !user.is_active })}
              >
                {user.is_active ? 'Desactivar' : 'Activar'}
              </Button>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-400">Sin usuarios</div>
        )}
      </div>

      <UserModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onSaved={() => { setShowNew(false); qc.invalidateQueries({ queryKey: ['users'] }) }}
      />
      {editing && (
        <UserModal
          open
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ['users'] }) }}
        />
      )}
    </div>
  )
}

function UserModal({ open, user, onClose, onSaved }: { open: boolean; user?: User; onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      username: user?.username ?? '',
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      role: user?.role ?? 'agent',
      password: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof createUser>[0]) => createUser(data).then((r) => r.data),
    onSuccess: onSaved,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<User>) => updateUser(user!.id, data).then((r) => r.data),
    onSuccess: onSaved,
  })

  const onSubmit = (data: typeof createMutation extends { mutateAsync: (d: infer T) => unknown } ? T : never) => {
    if (user) {
      const { password, ...rest } = data as { password?: string } & Partial<User>
      updateMutation.mutate(rest)
    } else {
      createMutation.mutate(data as Parameters<typeof createUser>[0])
    }
  }

  const loading = createMutation.isPending || updateMutation.isPending

  return (
    <Modal open={open} onClose={onClose} title={user ? 'Editar usuario' : 'Nuevo usuario'} size="sm">
      <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre" {...register('first_name')} />
          <Input label="Apellido" {...register('last_name')} />
        </div>
        <Input label="Usuario" {...register('username', { required: 'Requerido' })} error={errors.username?.message} />
        <Input label="Teléfono" {...register('phone')} />
        <Input label="Email" type="email" {...register('email')} />
        <Select label="Rol" {...register('role')} options={[
          { value: 'admin', label: 'Administrador' },
          { value: 'agent', label: 'Agente de Ventas' },
          { value: 'manager', label: 'Encargado SPA' },
          { value: 'driver', label: 'Chofer' },
          { value: 'washer', label: 'Lavador' },
        ]} />
        {!user && (
          <Input label="Contraseña" type="password" {...register('password', { required: 'Requerido' })} error={errors.password?.message} />
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>{user ? 'Guardar' : 'Crear'}</Button>
        </div>
      </form>
    </Modal>
  )
}
