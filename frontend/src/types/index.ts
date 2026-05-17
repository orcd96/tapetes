export type Role = 'admin' | 'agent' | 'manager' | 'driver' | 'washer'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: Role
  phone: string
  is_active?: boolean
}

export interface Client {
  id: number
  name: string
  phone: string
  email: string
  default_address: string
  notes: string
  created_at: string
}

export type OrderStatus =
  | 'pickup_scheduled'
  | 'picked_up'
  | 'received_at_spa'
  | 'washing'
  | 'ready'
  | 'delivery_scheduled'
  | 'delivered'

export type PaymentStatus = 'pending' | 'partial' | 'paid'

export interface ServiceOrder {
  id: number
  folio: string
  client: number
  client_name: string
  client_phone: string
  created_by: number
  origin: 'agent_scheduled' | 'technician_walkin' | 'direct'
  pickup_address: string
  delivery_address: string
  status: OrderStatus
  status_display: string
  payment_status: PaymentStatus
  payment_status_display: string
  total_amount: string
  amount_paid: string
  rug_count: number
  notes: string
  created_at: string
  updated_at: string
}

export type FiberType = 'synthetic' | 'natural' | 'mixed'
export type RugStatus = 'received' | 'washing' | 'ready' | 'delivered'

export interface RugPhoto {
  id: number
  photo_type: 'before' | 'after' | 'damage'
  file: string
  uploaded_by: number
  uploaded_at: string
}

export interface Rug {
  id: number
  service_order: number
  index: number
  width_cm: string
  height_cm: string
  area_m2: string
  fiber_type: FiberType
  fiber_type_display: string
  status: RugStatus
  status_display: string
  assigned_washer: number | null
  assigned_washer_name: string | null
  price_per_m2: string
  subtotal?: string
  total: string
  odor_treatment: boolean
  odor_price: string
  stain_protector: boolean
  stain_price: string
  condition_notes: string
  photos: RugPhoto[]
  created_at: string
}

export interface Pickup {
  id: number
  service_order: number
  order_folio: string
  client_name: string
  client_phone: string
  pickup_address: string
  scheduled_at: string
  driver: number | null
  actual_at: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  failure_reason: string
  notes: string
}

export interface Delivery {
  id: number
  service_order: number
  order_folio: string
  client_name: string
  client_phone: string
  delivery_address: string
  scheduled_at: string
  driver: number | null
  actual_at: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  rug_count: number
  notes: string
}

export interface Payment {
  id: number
  service_order: number
  amount: string
  method: 'cash' | 'transfer' | 'card'
  method_display: string
  paid_at: string
  received_by: number
  received_by_name: string
  stage: 'at_scheduling' | 'at_pickup' | 'at_spa' | 'at_delivery'
  stage_display: string
  notes: string
}

export interface PriceConfig {
  id: number
  fiber_type: FiberType
  price_per_m2: string
  effective_from: string
  created_by: number
}

export interface DashboardData {
  orders_today: number
  orders_month: number
  rugs_in_process: number
  rugs_ready: number
  income_today: number
  income_month: number
  pending_payment_total: number
  orders_by_status: Record<OrderStatus, number>
}

export interface TokenPair {
  access: string
  refresh: string
}
