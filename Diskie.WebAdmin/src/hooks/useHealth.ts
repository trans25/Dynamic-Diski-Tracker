import { useQuery } from '@tanstack/react-query'
import { healthService } from '../api/services/healthService'

export const healthKeys = {
  summary: ['health'] as const,
}

export function useHealth() {
  return useQuery({
    queryKey: healthKeys.summary,
    queryFn: () => healthService.getSummary(),
    refetchInterval: 30000,
  })
}
