import { apiClient, unwrap } from '../apiClient'
import type {
  ApiResponse,
  SuperAdminDashboardViewModel,
  UserViewModel,
} from '../types'

// Maps to SuperAdminController (api/admin/super-admin).
export const superAdminService = {
  async getProfile(): Promise<UserViewModel> {
    const res = await apiClient.get<ApiResponse<UserViewModel>>(
      '/admin/super-admin/profile'
    )
    return unwrap(res)
  },

  async getDashboard(): Promise<SuperAdminDashboardViewModel> {
    const res = await apiClient.get<ApiResponse<SuperAdminDashboardViewModel>>(
      '/admin/super-admin/dashboard'
    )
    return unwrap(res)
  },
}
