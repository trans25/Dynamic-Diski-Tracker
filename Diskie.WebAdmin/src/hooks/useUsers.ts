import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { usersService } from '../api/services/usersService'
import type { AssignRoleRequest } from '../api/types'

export const userKeys = {
  all: ['users'] as const,
  byTenant: (tenantId?: string) => ['users', tenantId ?? 'all'] as const,
}

export function useUsers(tenantId?: string) {
  return useQuery({
    queryKey: userKeys.byTenant(tenantId),
    queryFn: () => usersService.getAll(tenantId),
  })
}

export function useUserMutations() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: userKeys.all })

  const assignRole = useMutation({
    mutationFn: (payload: AssignRoleRequest) =>
      usersService.assignRole(payload),
    onSuccess: invalidate,
  })

  const enable = useMutation({
    mutationFn: (id: string) => usersService.enable(id),
    onSuccess: invalidate,
  })

  const disable = useMutation({
    mutationFn: (id: string) => usersService.disable(id),
    onSuccess: invalidate,
  })

  return { assignRole, enable, disable }
}
