interface BadgeProps {
  label: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange'
  size?: 'sm' | 'md'
}

const colors = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
}

export function Badge({ label, color = 'gray', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colors[color]} ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
      {label}
    </span>
  )
}

export function orderStatusBadge(status: string, display: string) {
  const colorMap: Record<string, BadgeProps['color']> = {
    pickup_scheduled: 'blue',
    picked_up: 'purple',
    received_at_spa: 'orange',
    washing: 'yellow',
    ready: 'green',
    delivery_scheduled: 'blue',
    delivered: 'gray',
  }
  return <Badge label={display} color={colorMap[status] ?? 'gray'} />
}

export function paymentStatusBadge(status: string, display: string) {
  const colorMap: Record<string, BadgeProps['color']> = {
    pending: 'red',
    partial: 'yellow',
    paid: 'green',
  }
  return <Badge label={display} color={colorMap[status] ?? 'gray'} />
}

export function rugStatusBadge(status: string, display: string) {
  const colorMap: Record<string, BadgeProps['color']> = {
    received: 'blue',
    washing: 'yellow',
    ready: 'green',
    delivered: 'gray',
  }
  return <Badge label={display} color={colorMap[status] ?? 'gray'} />
}
