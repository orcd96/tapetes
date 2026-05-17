import { type ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Package, Truck, ShowerHead, LogOut,
  Menu, X, ClipboardList, DollarSign, Settings, User
} from 'lucide-react'
import { useAuthStore } from '../../stores/auth'
import type { Role } from '../../types'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  roles: Role[]
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin'] },
  { to: '/orders', label: 'Órdenes', icon: <ClipboardList size={20} />, roles: ['admin', 'agent', 'manager'] },
  { to: '/clients', label: 'Clientes', icon: <Users size={20} />, roles: ['admin', 'agent', 'manager'] },
  { to: '/spa', label: 'Tablero SPA', icon: <ShowerHead size={20} />, roles: ['admin', 'manager'] },
  { to: '/route', label: 'Mi Ruta', icon: <Truck size={20} />, roles: ['driver'] },
  { to: '/rugs', label: 'Mis Tapetes', icon: <Package size={20} />, roles: ['washer'] },
  { to: '/prices', label: 'Precios', icon: <DollarSign size={20} />, roles: ['admin'] },
  { to: '/users', label: 'Usuarios', icon: <Settings size={20} />, roles: ['admin'] },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout, hasRole } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const visibleItems = navItems.filter((item) => hasRole(...item.roles))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <span className="text-lg font-bold text-blue-700">RugSpa</span>
        <button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Menu size={22} />
        </button>
      </header>

      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="fixed h-screen w-64 border-r border-gray-200 bg-white">
            <div className="flex h-16 items-center border-b border-gray-100 px-6">
              <span className="text-xl font-bold text-blue-700">RugSpa</span>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              {visibleItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    location.pathname.startsWith(item.to)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="absolute bottom-0 w-full border-t border-gray-100 p-4">
              <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <User size={16} />
                </div>
                <div className="flex-1 truncate">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user?.first_name || user?.username}
                  </p>
                  <p className="text-xs text-gray-400">{user?.role}</p>
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
            <aside className="relative h-full w-72 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <span className="text-xl font-bold text-blue-700">RugSpa</span>
                <button onClick={() => setMenuOpen(false)} className="text-gray-400">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                {visibleItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                      location.pathname.startsWith(item.to)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-gray-100 p-4">
                <div className="mb-3 px-3">
                  <p className="text-sm font-medium">{user?.first_name || user?.username}</p>
                  <p className="text-xs text-gray-400">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-7xl p-4 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav for field roles */}
      {hasRole('driver', 'washer') && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-gray-200 bg-white lg:hidden">
          {visibleItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs ${
                location.pathname.startsWith(item.to) ? 'text-blue-700' : 'text-gray-500'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
