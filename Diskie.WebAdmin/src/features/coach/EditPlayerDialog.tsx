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
  MenuItem,
  Switch,
  TextField,
} from '@mui/material'
import type { RosterPlayerViewModel } from '../../api/types'

const schema = z.object({
  fullName: z.string().min(1, 'Player name is required.'),
  position: z.string().optional(),
  jerseyNumber: z
    .union([z.coerce.number().int().min(0).max(999), z.nan()])
    .optional(),
  teamRole: z.string().optional(),
  isActive: z.boolean(),
})

export type EditPlayerFormValues = z.infer<typeof schema>

type EditPlayerDialogProps = {
  open: boolean
  player?: RosterPlayerViewModel | null
  positionOptions?: string[] | null
  submitting?: boolean
  onClose: () => void
  onSubmit: (values: EditPlayerFormValues) => void
}

export function EditPlayerDialog({
  open,
  player,
  positionOptions,
  submitting,
  onClose,
  onSubmit,
}: EditPlayerDialogProps) {
  const defaults = useMemo<z.input<typeof schema>>(
    () => ({
      fullName: player ? `${player.firstName} ${player.lastName}`.trim() : '',
      position: player?.position ?? '',
      jerseyNumber: player?.jerseyNumber ?? undefined,
      teamRole: player?.teamRole ?? '',
      isActive: player?.isActive ?? true,
    }),
    [player]
  )

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, EditPlayerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })

  useEffect(() => {
    if (open) {
      reset(defaults)
    }
  }, [open, reset, defaults])

  const hasPositions = Boolean(positionOptions && positionOptions.length > 0)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Player</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Full name"
                fullWidth
                autoFocus
                error={Boolean(errors.fullName)}
                helperText={errors.fullName?.message}
                {...register('fullName')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              {hasPositions ? (
                <Controller
                  control={control}
                  name="position"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      select
                      label="Position"
                      fullWidth
                    >
                      <MenuItem value="">
                        <em>Unassigned</em>
                      </MenuItem>
                      {positionOptions!.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              ) : (
                <TextField label="Position" fullWidth {...register('position')} />
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Jersey #"
                type="number"
                fullWidth
                error={Boolean(errors.jerseyNumber)}
                helperText={errors.jerseyNumber?.message}
                {...register('jerseyNumber')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                label="Team role"
                fullWidth
                placeholder="e.g. Captain"
                {...register('teamRole')}
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
                    label="Active on roster"
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
