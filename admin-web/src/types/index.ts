export type UserRole = 'admin' | 'supervisor' | 'operator'
export type BatchStatus = 'active' | 'harvested' | 'closed'
export type ReportStatus = 'pending' | 'verified' | 'rejected'
export type ItemType = 'feed' | 'medicine' | 'chicks'
export type TransactionType = 'inward' | 'issue'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Farm {
  id: string
  site_id: string
  name: string
  location: string
  gps_lat: number
  gps_lng: number
  capacity: number
  created_by: string
  created_at: string
}

export interface Batch {
  id: string
  farm_id: string
  batch_code: string
  chick_count: number
  start_date: string
  status: BatchStatus
  created_at: string
}

export interface Procurement {
  id: string
  item_type: ItemType
  quantity: number
  unit: string
  unit_price: number
  total_cost: number
  supplier: string | null
  purchased_at: string
  created_at: string
}

export interface InventoryTransaction {
  id: string
  item_type: string
  transaction_type: TransactionType
  quantity: number
  balance_after: number
  notes: string | null
  procurement_id: string | null
  batch_id: string | null
  created_at: string
}

export interface InventoryBalance {
  item_type: string
  current_balance: number
}

export interface DailyReport {
  id: string
  batch_id: string
  reported_by: string
  report_date: string
  mortality: number
  feed_consumed: number
  gps_lat: number
  gps_lng: number
  gps_valid: boolean
  status: ReportStatus
  verified_by: string | null
  rejection_reason: string | null
  created_at: string
}

export interface Weighing {
  id: string
  batch_id: string
  gross_weight: number
  tare_weight: number
  net_weight: number
  mortality: number
  notes: string | null
  recorded_by: string
  created_at: string
}

export interface Transport {
  id: string
  batch_id: string
  vehicle_number: string
  driver_name: string | null
  origin: string
  destination: string
  dispatch_time: string
  arrival_time: string | null
  created_at: string
}

export interface Processing {
  id: string
  batch_id: string
  farm_weight: number
  inward_weight: number
  loss: number
  wings_kg: number
  legs_kg: number
  breast_kg: number
  lollipop_kg: number
  waste_kg: number
  shelf_life_days: number
  processed_at: string
  processed_by: string
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id: string | null
  action: string
  entity: string | null
  entity_id: string | null
  detail: string | null
  created_at: string
}

export interface Sale {
  id: string
  batch_id: string
  buyer_name: string
  total_weight: number
  price_per_kg: number
  total_amount: number
  sold_at: string
  notes: string | null
  created_at: string
}

export interface BatchPerformance {
  batch_id: string
  initial_chick_count: number
  total_mortality: number
  survival_rate_percent: number
  total_feed_consumed_kg: number
  total_net_weight_kg: number
  feed_conversion_ratio: number
}

export interface BatchProfit {
  batch_id: string
  total_revenue: number
  total_costs_estimated: number
  net_profit_estimated: number
}

export interface TokenResponse {
  access_token: string
  token_type: string
}
