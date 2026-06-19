import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { tenantsService } from '../api/services/tenantsService'
import type {
  CreateTenantRequest,
  UpdateTenantRequest,
} from '../api/types'

export const tenantKeys = {
  all: ['tenants'] as const,
  pending: ['tenants', 'pending'] as const,
  pendingSportRequests: ['tenants', 'pending-sport-requests'] as const,
}

export function useTenants() {
  return useQuery({
    queryKey: tenantKeys.all,
    queryFn: () => tenantsService.getAll(),
  })
}

export function usePendingTenants() {
  return useQuery({
    queryKey: tenantKeys.pending,
    queryFn: () => tenantsService.getPending(),
  })
}

export function usePendingSportRequests() {
  return useQuery({
    queryKey: tenantKeys.pendingSportRequests,
    queryFn: () => tenantsService.getPendingSportRequests(),
  })
}

export function useTenantMutations() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: tenantKeys.all }),
      queryClient.invalidateQueries({ queryKey: tenantKeys.pending }),
      queryClient.invalidateQueries({ queryKey: tenantKeys.pendingSportRequests }),
    ])

  const create = useMutation({
    mutationFn: (payload: CreateTenantRequest) => tenantsService.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: (payload: UpdateTenantRequest) => tenantsService.update(payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => tenantsService.remove(id),
    onSuccess: invalidate,
  })

  const suspend = useMutation({
    mutationFn: (id: string) => tenantsService.suspend(id),
    onSuccess: invalidate,
  })

  const activate = useMutation({
    mutationFn: (id: string) => tenantsService.activate(id),
    onSuccess: invalidate,
  })

  const approve = useMutation({
    mutationFn: (id: string) => tenantsService.approve(id),
    onSuccess: invalidate,
  })

  const approveSportRequest = useMutation({
    mutationFn: (requestId: string) => tenantsService.approveSportRequest(requestId),
    onSuccess: invalidate,
  })

  const rejectSportRequest = useMutation({
    mutationFn: (requestId: string) => tenantsService.rejectSportRequest(requestId),
    onSuccess: invalidate,
  })

  return {
    create,
    update,
    remove,
    suspend,
    activate,
    approve,
    approveSportRequest,
    rejectSportRequest,
  }
}
