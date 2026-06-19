import { apiClient, unwrap } from '../apiClient'
import type { ApiResponse, SystemHealthViewModel } from '../types'

// Maps to HealthController (api/admin/health).
export const healthService = {
  async getSummary(): Promise<SystemHealthViewModel> {
    const res = await apiClient.get<ApiResponse<SystemHealthViewModel>>(
      '/admin/health/summary'
    )
    return unwrap(res)
  },
}
