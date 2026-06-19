import { apiClient, unwrap } from '../apiClient'
import type {
  ApiResponse,
  AssignRoleRequest,
  UserViewModel,
} from '../types'

// Maps to AdminUsersController (api/admin/users).
export const usersService = {
  async getAll(tenantId?: string): Promise<UserViewModel[]> {
    const res = await apiClient.get<ApiResponse<UserViewModel[]>>(
      '/admin/users',
      { params: tenantId ? { tenantId } : undefined }
    )
    return unwrap(res)
  },

  async getById(id: string): Promise<UserViewModel> {
    const res = await apiClient.get<ApiResponse<UserViewModel>>(
      `/admin/users/${id}`
    )
    return unwrap(res)
  },

  async assignRole(payload: AssignRoleRequest): Promise<UserViewModel> {
    const res = await apiClient.put<ApiResponse<UserViewModel>>(
      '/admin/users/role',
      payload
    )
    return unwrap(res)
  },

  async disable(id: string): Promise<void> {
    await apiClient.patch<ApiResponse<object>>(`/admin/users/${id}/disable`)
  },

  async enable(id: string): Promise<void> {
    await apiClient.patch<ApiResponse<object>>(`/admin/users/${id}/enable`)
  },
}
