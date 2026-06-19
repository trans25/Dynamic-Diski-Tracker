import { apiClient, unwrap } from '../apiClient'
import type {
  ApiResponse,
  CreateTenantRequest,
  PendingSportRequestViewModel,
  TenantViewModel,
  UpdateTenantRequest,
} from '../types'

// Maps to TenantsController (api/admin/tenants).
export const tenantsService = {
  async getAll(): Promise<TenantViewModel[]> {
    const res = await apiClient.get<ApiResponse<TenantViewModel[]>>(
      '/admin/tenants'
    )
    return unwrap(res)
  },

  async getPending(): Promise<TenantViewModel[]> {
    const res = await apiClient.get<ApiResponse<TenantViewModel[]>>(
      '/admin/tenants/pending'
    )
    return unwrap(res)
  },

  async getById(id: string): Promise<TenantViewModel> {
    const res = await apiClient.get<ApiResponse<TenantViewModel>>(
      `/admin/tenants/${id}`
    )
    return unwrap(res)
  },

  async create(payload: CreateTenantRequest): Promise<TenantViewModel> {
    const res = await apiClient.post<ApiResponse<TenantViewModel>>(
      '/admin/tenants',
      payload
    )
    return unwrap(res)
  },

  async update(payload: UpdateTenantRequest): Promise<TenantViewModel> {
    const res = await apiClient.put<ApiResponse<TenantViewModel>>(
      `/admin/tenants/${payload.id}`,
      payload
    )
    return unwrap(res)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<object>>(`/admin/tenants/${id}`)
  },

  async suspend(id: string): Promise<void> {
    await apiClient.patch<ApiResponse<object>>(`/admin/tenants/${id}/suspend`)
  },

  async activate(id: string): Promise<void> {
    await apiClient.patch<ApiResponse<object>>(`/admin/tenants/${id}/activate`)
  },

  async approve(id: string): Promise<void> {
    await apiClient.patch<ApiResponse<object>>(`/admin/tenants/${id}/approve`)
  },

  async getPendingSportRequests(): Promise<PendingSportRequestViewModel[]> {
    const res = await apiClient.get<ApiResponse<PendingSportRequestViewModel[]>>(
      '/admin/pending-requests'
    )
    return unwrap(res)
  },

  async approveSportRequest(requestId: string): Promise<void> {
    await apiClient.post<ApiResponse<object>>(`/admin/approve-request/${requestId}`)
  },

  async rejectSportRequest(requestId: string): Promise<void> {
    await apiClient.post<ApiResponse<object>>(`/admin/reject-request/${requestId}`)
  },

  async disableTenantUser(tenantId: string, userId: string): Promise<void> {
    await apiClient.patch<ApiResponse<object>>(
      `/admin/tenants/${tenantId}/users/${userId}/disable`
    )
  },
}
