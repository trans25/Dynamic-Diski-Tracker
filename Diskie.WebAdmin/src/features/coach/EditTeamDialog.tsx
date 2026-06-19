import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
} from '@mui/material'
import type { CoachTeamViewModel } from '../../api/types'

const schema = z.object({
  name: z.string().min(1, 'Team name is required.'),
  ageGroup: z.string().optional(),
  genderCategory: z.string().optional(),
  level: z.string().optional(),
  isActive: z.boolean(),
})

export type EditTeamFormValues = z.infer<typeof schema>

type EditTeamDialogProps = {
  open: boolean
  team?: CoachTeamViewModel | null
  submitting?: boolean
  onClose: () => void
  onSubmit: (values: EditTeamFormValues) => void
}

export function EditTeamDialog({
  open,
  team,
  submitting,
  onClose,
  onSubmit,
}: EditTeamDialogProps) {
  const defaults = useMemo<z.input<typeof schema>>(
    () => ({
      name: team?.name ?? '',
      ageGroup: team?.ageGroup ?? '',
      genderCategory: team?.genderCategory ?? '',
      level: team?.level ?? '',
      isActive: team?.isActive ?? true,
    }),
    [team]
  )

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, EditTeamFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })

  useEffect(() => {
    if (open) {
      reset(defaults)
    }
  }, [open, reset, defaults])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Team</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Team name"
                fullWidth
                autoFocus
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                {...register('name')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Age group"
                fullWidth
                placeholder="U15"
                {...register('ageGroup')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Gender"
                fullWidth
                placeholder="Boys"
                {...register('genderCategory')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Level"
                fullWidth
                placeholder="1st Team"
                {...register('level')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Active team"
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
