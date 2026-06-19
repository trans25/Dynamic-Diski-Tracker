import { apiClient, unwrap } from '../apiClient'
import type {
  ApiResponse,
  CreateSportTemplateRequest,
  SportTemplateViewModel,
  UpdateSportTemplateRequest,
} from '../types'

// Maps to TemplatesController (api/admin/templates).
export const templatesService = {
  async getAll(): Promise<SportTemplateViewModel[]> {
    const res = await apiClient.get<ApiResponse<SportTemplateViewModel[]>>(
      '/admin/sport-templates'
    )
    return unwrap(res)
  },

  async getById(id: string): Promise<SportTemplateViewModel> {
    const res = await apiClient.get<ApiResponse<SportTemplateViewModel>>(
      `/admin/templates/${id}`
    )
    return unwrap(res)
  },

  async create(
    payload: CreateSportTemplateRequest
  ): Promise<SportTemplateViewModel> {
    const res = await apiClient.post<ApiResponse<SportTemplateViewModel>>(
      '/admin/sport-templates',
      payload
    )
    return unwrap(res)
  },

  async update(
    payload: UpdateSportTemplateRequest
  ): Promise<SportTemplateViewModel> {
    const res = await apiClient.put<ApiResponse<SportTemplateViewModel>>(
      `/admin/templates/${payload.id}`,
      payload
    )
    return unwrap(res)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<object>>(`/admin/templates/${id}`)
  },
}
