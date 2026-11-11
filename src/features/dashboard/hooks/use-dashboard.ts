import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary, getRecentMovements } from '../services/dashboard-service'

/** Prefijo común: otras features lo invalidan al cambiar productos, inventario o ventas. */
export const dashboardKey = ['dashboard'] as const

export function useDashboardSummary() {
  return useQuery({ queryKey: [...dashboardKey, 'summary'], queryFn: getDashboardSummary })
}

export function useRecentMovements() {
  return useQuery({ queryKey: [...dashboardKey, 'recent-movements'], queryFn: () => getRecentMovements() })
}
