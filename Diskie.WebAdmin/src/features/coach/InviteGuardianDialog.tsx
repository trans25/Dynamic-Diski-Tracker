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
  Grid,
  Switch,
  TextField,
} from '@mui/material'

const schema = z.object({
  guardianName: z.string().min(1, 'Guardian name is required.'),
  guardianEmail: z.string().min(1, 'Email is required.').email('Enter a valid email.'),
  guardianPhone: z.string().optional(),
  relationship: z.string().optional(),
  isPrimary: z.boolean(),
})

export type InviteGuardianFormValues = z.infer<typeof schema>

type InviteGuardianDialogProps = {
  open: boolean
  playerName?: string
  submitting?: boolean
  onClose: () => void
  onSubmit: (values: InviteGuardianFormValues) => void
}

export function InviteGuardianDialog({
  open,
  playerName,
  submitting,
  onClose,
  onSubmit,
}: InviteGuardianDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteGuardianFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      guardianName: '',
      guardianEmail: '',
      guardianPhone: '',
      relationship: '',
      isPrimary: false,
    },
  })

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Invite Guardian{playerName ? ` · ${playerName}` : ''}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Guardian name"
                fullWidth
                autoFocus
                error={Boolean(errors.guardianName)}
                helperText={errors.guardianName?.message}
                {...register('guardianName')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Email"
                fullWidth
                error={Boolean(errors.guardianEmail)}
                helperText={errors.guardianEmail?.message}
                {...register('guardianEmail')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Phone"
                fullWidth
                {...register('guardianPhone')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Relationship"
                placeholder="Parent, Aunt, …"
                fullWidth
                {...register('relationship')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={<Switch {...register('isPrimary')} />}
                label="Primary guardian"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            Send Invite
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
