import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import type { SportTemplateViewModel } from '../../api/types'

const schema = z.object({
  name: z.string().min(1, 'Name is required.'),
  displayName: z.string().min(1, 'Display name is required.'),
  icon: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  positionOptions: z.string().optional().or(z.literal('')),
  defaultSeasonWeeks: z.number().int().min(0).optional(),
  isActive: z.boolean(),
})

export type TemplateFormValues = z.infer<typeof schema>

type TemplateFormDialogProps = {
  open: boolean
  template?: SportTemplateViewModel | null
  submitting?: boolean
  onClose: () => void
  onSubmit: (values: TemplateFormValues) => void
}

const emptyValues: TemplateFormValues = {
  name: '',
  displayName: '',
  icon: '',
  description: '',
  positionOptions: '',
  defaultSeasonWeeks: 0,
  isActive: true,
}

export function TemplateFormDialog({
  open,
  template,
  submitting,
  onClose,
  onSubmit,
}: TemplateFormDialogProps) {
  const isEdit = Boolean(template)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset(
        template
          ? {
              name: template.name ?? '',
              displayName: template.displayName ?? '',
              icon: template.icon ?? '',
              description: template.description ?? '',
              positionOptions: (template.positionOptions ?? []).join(', '),
              defaultSeasonWeeks: template.defaultSeasonWeeks ?? 0,
              isActive: template.isActive,
            }
          : emptyValues
      )
    }
  }, [open, template, reset])

  const isActive = watch('isActive')

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>
          {isEdit ? 'Edit Sport Template' : 'Create Sport Template'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Name (key)"
                fullWidth
                required
                error={Boolean(errors.name)}
                helperText={errors.name?.message ?? 'e.g. soccer'}
                {...register('name')}
              />
              <TextField
                label="Display Name"
                fullWidth
                required
                error={Boolean(errors.displayName)}
                helperText={errors.displayName?.message}
                {...register('displayName')}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Icon"
                fullWidth
                error={Boolean(errors.icon)}
                helperText={errors.icon?.message}
                {...register('icon')}
              />
              <TextField
                label="Default Season Weeks"
                type="number"
                fullWidth
                error={Boolean(errors.defaultSeasonWeeks)}
                helperText={errors.defaultSeasonWeeks?.message}
                {...register('defaultSeasonWeeks', { valueAsNumber: true })}
              />
            </Stack>
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
              {...register('description')}
            />
            <TextField
              label="Position Options"
              fullWidth
              error={Boolean(errors.positionOptions)}
              helperText={
                errors.positionOptions?.message ?? 'Comma-separated, e.g. GK, DEF, MID, FWD'
              }
              {...register('positionOptions')}
            />
            {isEdit && (
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => setValue('isActive', e.target.checked)}
                  />
                }
                label="Active"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {isEdit ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
