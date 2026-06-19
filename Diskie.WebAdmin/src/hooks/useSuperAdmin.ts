import { useQuery } from '@tanstack/react-query'
import { superAdminService } from '../api/services/superAdminService'

export const dashboardKeys = {
  dashboard: ['dashboard'] as const,
  profile: ['profile'] as const,
}

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.dashboard,
    queryFn: () => superAdminService.getDashboard(),
  })
}

export function useProfile() {
  return useQuery({
    queryKey: dashboardKeys.profile,
    queryFn: () => superAdminService.getProfile(),
  })
}
