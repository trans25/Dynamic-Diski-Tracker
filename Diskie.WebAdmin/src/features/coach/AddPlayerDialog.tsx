import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'

const schema = z.object({
  fullName: z.string().min(1, 'Player name is required.'),
  position: z.string().optional(),
  jerseyNumber: z
    .union([z.coerce.number().int().min(0).max(999), z.nan()])
    .optional(),
  dateOfBirth: z.string().optional(),
  guardianName: z.string().optional(),
  guardianEmail: z
    .union([z.string().email('Enter a valid email.'), z.literal('')])
    .optional(),
  guardianPhone: z.string().optional(),
})

export type AddPlayerFormValues = z.infer<typeof schema>

type AddPlayerDialogProps = {
  open: boolean
  teamName?: string
  positionOptions?: string[] | null
  submitting?: boolean
  onClose: () => void
  onSubmit: (values: AddPlayerFormValues) => void
}

export function AddPlayerDialog({
  open,
  teamName,
  positionOptions,
  submitting,
  onClose,
  onSubmit,
}: AddPlayerDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, AddPlayerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      position: '',
      jerseyNumber: undefined,
      dateOfBirth: '',
      guardianName: '',
      guardianEmail: '',
      guardianPhone: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset()
    }
  }, [open, reset])

  const hasPositions = Boolean(positionOptions && positionOptions.length > 0)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Add Player{teamName ? ` · ${teamName}` : ''}
      </DialogTitle>
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Date of birth"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                {...register('dateOfBirth')}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Guardian (optional)
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Guardian name"
                fullWidth
                {...register('guardianName')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Guardian email"
                fullWidth
                error={Boolean(errors.guardianEmail)}
                helperText={errors.guardianEmail?.message}
                {...register('guardianEmail')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Guardian phone"
                fullWidth
                {...register('guardianPhone')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            Add Player
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
