import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { login, getMe } from '../api/endpoints'
import { useAuthStore } from '../stores/auth'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

interface FormData {
  username: string
  password: string
}

const roleRedirect: Record<string, string> = {
  admin: '/dashboard',
  agent: '/orders',
  manager: '/spa',
  driver: '/route',
  washer: '/rugs',
}

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()
  const { setTokens, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: FormData) => {
    setError('')
    setLoading(true)
    try {
      const { data: tokens } = await login(data.username, data.password)
      setTokens(tokens.access, tokens.refresh)
      const { data: me } = await getMe()
      setUser(me)
      navigate(roleRedirect[me.role] ?? '/orders')
    } catch {
      setError('Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-700">RugSpa</h1>
          <p className="mt-1 text-gray-500">Sistema de gestión</p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Iniciar sesión</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Usuario"
              {...register('username', { required: 'Campo requerido' })}
              error={errors.username?.message}
              autoComplete="username"
            />
            <Input
              label="Contraseña"
              type="password"
              {...register('password', { required: 'Campo requerido' })}
              error={errors.password?.message}
              autoComplete="current-password"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
              Entrar
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-gray-400">
          <a href="/track" className="hover:underline">Seguimiento de mi orden</a>
        </p>
      </div>
    </div>
  )
}
