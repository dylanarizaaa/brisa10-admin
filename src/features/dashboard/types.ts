import type { MovementType } from '@/types/database'

export type { DashboardSummary } from '@/types/database'

export interface RecentMovement {
  id: string
  type: MovementType
  quantity: number
  created_at: string
  product_name: string
  user_name: string
}
