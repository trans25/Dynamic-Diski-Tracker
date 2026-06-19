import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { billingService } from '../api/services/billingService'
import type { AssignBillingPlanRequest } from '../api/types'

export const billingKeys = {
  all: ['billing'] as const,
}

export function useBilling() {
  return useQuery({
    queryKey: billingKeys.all,
    queryFn: () => billingService.getAll(),
  })
}

export function useBillingMutations() {
  const queryClient = useQueryClient()

  const assignPlan = useMutation({
    mutationFn: (payload: AssignBillingPlanRequest) =>
      billingService.assignPlan(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: billingKeys.all }),
  })

  return { assignPlan }
}
