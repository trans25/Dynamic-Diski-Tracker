import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { templatesService } from '../api/services/templatesService'
import type {
  CreateSportTemplateRequest,
  UpdateSportTemplateRequest,
} from '../api/types'

export const templateKeys = {
  all: ['templates'] as const,
}

export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.all,
    queryFn: () => templatesService.getAll(),
  })
}

export function useTemplateMutations() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: templateKeys.all })

  const create = useMutation({
    mutationFn: (payload: CreateSportTemplateRequest) =>
      templatesService.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: (payload: UpdateSportTemplateRequest) =>
      templatesService.update(payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => templatesService.remove(id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
