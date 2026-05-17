import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
}

export function Card({ children, className = '', title, action }: CardProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'red'
}

const statColors = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600',
}

export function StatCard({ label, value, sub, icon, color = 'blue' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        {icon && (
          <div className={`rounded-lg p-2 ${statColors[color]}`}>{icon}</div>
        )}
      </div>
    </div>
  )
}
