import { client } from './client'
import type {
  TokenResponse, User, Farm, Batch, Procurement, InventoryTransaction,
  InventoryBalance, DailyReport, Weighing, Transport, Processing, Sale,
  BatchPerformance, BatchProfit, ActivityLog,
} from '../types'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  client.post<TokenResponse>('/auth/login', { email, password }).then(r => r.data)

export const register = (data: { name: string; email: string; password: string; role: string }) =>
  client.post<User>('/auth/register', data).then(r => r.data)

// ── Users ─────────────────────────────────────────────────────────────────────
export const getMe = () => client.get<User>('/users/me').then(r => r.data)
export const getUsers = () => client.get<User[]>('/users/').then(r => r.data)

// ── Farms ─────────────────────────────────────────────────────────────────────
export const getFarms = () => client.get<Farm[]>('/farms/').then(r => r.data)
export const getFarm = (id: string) => client.get<Farm>(`/farms/${id}`).then(r => r.data)
export const createFarm = (data: Omit<Farm, 'id' | 'created_by' | 'created_at'>) =>
  client.post<Farm>('/farms/', data).then(r => r.data)
export const updateFarm = (id: string, data: Partial<Farm>) =>
  client.patch<Farm>(`/farms/${id}`, data).then(r => r.data)

// ── Batches ───────────────────────────────────────────────────────────────────
export const getBatches = () => client.get<Batch[]>('/batches/').then(r => r.data)
export const getBatch = (id: string) => client.get<Batch>(`/batches/${id}`).then(r => r.data)
export const createBatch = (data: { farm_id: string; batch_code: string; chick_count: number; start_date: string }) =>
  client.post<Batch>('/batches/', data).then(r => r.data)
export const updateBatch = (id: string, status: string) =>
  client.patch<Batch>(`/batches/${id}`, { status }).then(r => r.data)

// ── Procurement ───────────────────────────────────────────────────────────────
export const getProcurements = () => client.get<Procurement[]>('/procurement/').then(r => r.data)
export const createProcurement = (data: {
  item_type: string; quantity: number; unit: string
  unit_price: number; supplier?: string; purchased_at: string
}) => client.post<Procurement>('/procurement/', data).then(r => r.data)

// ── Inventory ─────────────────────────────────────────────────────────────────
export const getInventory = (item_type?: string) =>
  client.get<InventoryTransaction[]>('/inventory/', { params: { item_type } }).then(r => r.data)
export const getBalance = (item_type: string) =>
  client.get<InventoryBalance>(`/inventory/balance/${item_type}`).then(r => r.data)
export const addInward = (data: { item_type: string; quantity: number; procurement_id: string; notes?: string }) =>
  client.post<InventoryTransaction>('/inventory/inward', data).then(r => r.data)
export const issueStock = (data: { item_type: string; quantity: number; batch_id: string; notes?: string }) =>
  client.post<InventoryTransaction>('/inventory/issue', data).then(r => r.data)

// ── Daily Reports ─────────────────────────────────────────────────────────────
export const getDailyReports = (batch_id?: string) =>
  client.get<DailyReport[]>('/daily-reports/', { params: { batch_id } }).then(r => r.data)
export const createDailyReport = (data: {
  batch_id: string; report_date: string; mortality: number
  feed_consumed: number; gps_lat: number; gps_lng: number
}) => client.post<DailyReport>('/daily-reports/', data).then(r => r.data)
export const verifyReport = (id: string, status: string, rejection_reason?: string) =>
  client.patch<DailyReport>(`/daily-reports/${id}/verify`, { status, rejection_reason }).then(r => r.data)

// ── Weighing ──────────────────────────────────────────────────────────────────
export const getWeighings = (batch_id?: string) =>
  client.get<Weighing[]>('/weighing/', { params: { batch_id } }).then(r => r.data)
export const createWeighing = (data: { batch_id: string; gross_weight: number; tare_weight: number; notes?: string }) =>
  client.post<Weighing>('/weighing/', data).then(r => r.data)

// ── Transport ─────────────────────────────────────────────────────────────────
export const getTransports = () => client.get<Transport[]>('/transport/').then(r => r.data)
export const getTransport = (id: string) => client.get<Transport>(`/transport/${id}`).then(r => r.data)
export const createTransport = (data: {
  batch_id: string; vehicle_number: string; driver_name?: string
  origin: string; destination: string; dispatch_time: string
}) => client.post<Transport>('/transport/', data).then(r => r.data)
export const recordArrival = (id: string, arrival_time: string) =>
  client.patch<Transport>(`/transport/${id}/arrival`, { arrival_time }).then(r => r.data)

// ── Processing ────────────────────────────────────────────────────────────────
export const getProcessing = (batch_id: string) =>
  client.get<Processing>(`/processing/${batch_id}`).then(r => r.data)
export const createProcessing = (data: {
  batch_id: string; farm_weight: number; inward_weight: number
  wings_kg: number; legs_kg: number; breast_kg: number; lollipop_kg: number; waste_kg: number
  shelf_life_days?: number
}) => client.post<Processing>('/processing/', data).then(r => r.data)

// ── Logs ──────────────────────────────────────────────────────────────────────
export const getActivityLogs = (skip = 0, limit = 100) =>
  client.get<ActivityLog[]>('/logs/', { params: { skip, limit } }).then(r => r.data)
export const getDailySummary = (for_date?: string) =>
  client.get<{ date: string; count: number; summary: string }>('/logs/summary', { params: { for_date } }).then(r => r.data)

// ── Sales ─────────────────────────────────────────────────────────────────────
export const getSales = (batch_id?: string) =>
  client.get<Sale[]>('/sales/', { params: { batch_id } }).then(r => r.data)
export const createSale = (data: {
  batch_id: string; buyer_name: string; total_weight: number
  price_per_kg: number; sold_at: string; notes?: string
}) => client.post<Sale>('/sales/', data).then(r => r.data)

// ── Reports ───────────────────────────────────────────────────────────────────
export const getBatchPerformance = (batch_id: string) =>
  client.get<BatchPerformance>(`/reports/batch/${batch_id}/performance`).then(r => r.data)
export const getBatchProfit = (batch_id: string) =>
  client.get<BatchProfit>(`/reports/batch/${batch_id}/profit`).then(r => r.data)
