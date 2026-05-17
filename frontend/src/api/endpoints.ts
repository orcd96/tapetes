import api from './client'
import type {
  User, Client, ServiceOrder, Rug, RugPhoto, Pickup, Delivery,
  Payment, PriceConfig, DashboardData, TokenPair
} from '../types'

// Auth
export const login = (username: string, password: string) =>
  api.post<TokenPair>('/auth/token/', { username, password })

export const refreshToken = (refresh: string) =>
  api.post<{ access: string }>('/auth/token/refresh/', { refresh })

// Me
export const getMe = () => api.get<User>('/users/me/')

// Users
export const getUsers = (params?: Record<string, string>) => api.get<User[]>('/users/', { params })
export const getDrivers = () => api.get<User[]>('/users/', { params: { role: 'driver' } })
export const createUser = (data: Partial<User> & { password: string }) =>
  api.post<User>('/users/', data)
export const updateUser = (id: number, data: Partial<User>) =>
  api.patch<User>(`/users/${id}/`, data)

// Clients
export const getClients = (search?: string) =>
  api.get<Client[]>('/clients/', { params: search ? { search } : {} })
export const getClient = (id: number) => api.get<Client>(`/clients/${id}/`)
export const createClient = (data: Partial<Client>) => api.post<Client>('/clients/', data)
export const updateClient = (id: number, data: Partial<Client>) =>
  api.patch<Client>(`/clients/${id}/`, data)
export const getClientOrders = (id: number) =>
  api.get<ServiceOrder[]>(`/clients/${id}/orders/`)

// Orders
export const getOrders = (params?: Record<string, string>) =>
  api.get<ServiceOrder[]>('/orders/', { params })
export const getOrder = (id: number) => api.get<ServiceOrder>(`/orders/${id}/`)
export const createOrder = (data: Partial<ServiceOrder>) =>
  api.post<ServiceOrder>('/orders/', data)
export const updateOrder = (id: number, data: Partial<ServiceOrder>) =>
  api.patch<ServiceOrder>(`/orders/${id}/`, data)
export const updateOrderStatus = (id: number, status: string) =>
  api.patch<ServiceOrder>(`/orders/${id}/status/`, { status })
export const trackOrder = (phone: string, name: string) =>
  api.get<ServiceOrder[]>('/orders/track/', { params: { phone, name } })

// Rugs
export const getOrderRugs = (orderId: number) =>
  api.get<Rug[]>(`/orders/${orderId}/rugs/`)
export const createRug = (orderId: number, data: Partial<Rug>) =>
  api.post<Rug>(`/orders/${orderId}/rugs/`, data)
export const updateRug = (id: number, data: Partial<Rug>) =>
  api.patch<Rug>(`/rugs/${id}/`, data)
export const updateRugStatus = (id: number, data: { status: string; assigned_washer?: number | null }) =>
  api.patch<Rug>(`/rugs/${id}/status/`, data)
export const uploadRugPhoto = (rugId: number, formData: FormData) =>
  api.post<RugPhoto>(`/rugs/${rugId}/photos/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const getWasherRugs = () => api.get<Rug[]>('/rugs/washer/')

// Logistics
export const getDriverRoute = () => api.get<{ pickups: Pickup[]; deliveries: Delivery[] }>('/logistics/driver/route/')
export const updatePickup = (id: number, data: Partial<Pickup>) =>
  api.patch<Pickup>(`/logistics/driver/pickups/${id}/`, data)
export const updateDelivery = (id: number, data: Partial<Delivery>) =>
  api.patch<Delivery>(`/logistics/driver/deliveries/${id}/`, data)
export const getPickups = () => api.get<Pickup[]>('/logistics/pickups/')
export const createPickup = (data: Partial<Pickup>) => api.post<Pickup>('/logistics/pickups/', data)
export const getDeliveries = () => api.get<Delivery[]>('/logistics/deliveries/')
export const createDelivery = (data: Partial<Delivery>) => api.post<Delivery>('/logistics/deliveries/', data)

// Payments
export const getOrderPayments = (orderId: number) =>
  api.get<Payment[]>(`/orders/${orderId}/payments/`)
export const createPayment = (orderId: number, data: Partial<Payment>) =>
  api.post<Payment>(`/orders/${orderId}/payments/`, data)

// Prices
export const getPrices = () => api.get<PriceConfig[]>('/orders/prices/')
export const getCurrentPrices = () =>
  api.get<Record<string, PriceConfig | null>>('/orders/prices/current/')
export const createPrice = (data: Partial<PriceConfig>) =>
  api.post<PriceConfig>('/orders/prices/', data)

// Dashboard
export const getDashboard = () => api.get<DashboardData>('/dashboard/')
export const getReports = (params?: { from?: string; to?: string }) =>
  api.get('/dashboard/reports/', { params })
