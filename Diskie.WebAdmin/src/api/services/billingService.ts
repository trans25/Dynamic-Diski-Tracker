import { apiClient, unwrap } from '../apiClient'
import type {
  ApiResponse,
  AssignBillingPlanRequest,
  TenantBillingViewModel,
} from '../types'

// Maps to BillingController (api/admin/billing).
export const billingService = {
  async getAll(): Promise<TenantBillingViewModel[]> {
    const res = await apiClient.get<ApiResponse<TenantBillingViewModel[]>>(
      '/admin/billing'
    )
    return unwrap(res)
  },

  async getByTenant(tenantId: string): Promise<TenantBillingViewModel> {
    const res = await apiClient.get<ApiResponse<TenantBillingViewModel>>(
      `/admin/billing/${tenantId}`
    )
    return unwrap(res)
  },

  async assignPlan(
    payload: AssignBillingPlanRequest
  ): Promise<TenantBillingViewModel> {
    const res = await apiClient.put<ApiResponse<TenantBillingViewModel>>(
      '/admin/billing/plan',
      payload
    )
    return unwrap(res)
  },
}
