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
import { injurySeverityNames, injuryStatusNames } from '../../api/types'
import type {
  CreateInjuryRequest,
  InjuryViewModel,
  UpdateInjuryRequest,
} from '../../api/types'

const schema = z.object({
  playerId: z.string().optional(),
  injuryType: z.string().min(1, 'Injury type is required.'),
  bodyPart: z.string().min(1, 'Body part is required.'),
  severity: z.coerce.number().int().min(0),
  occurredAt: z.string().optional(),
  estimatedReturnDate: z.string().optional(),
  actualReturnDate: z.string().optional(),
  status: z.coerce.number().int().min(0),
  medicalNotes: z.string().optional(),
  treatmentNotes: z.string().optional(),
  isMatchInjury: z.boolean(),
})

export type InjuryFormValues = z.infer<typeof schema>

type InjuryPlayerOption = {
  playerId: string
  name: string
}

type InjuryDialogProps = {
  open: boolean
  injury?: InjuryViewModel | null
  players: InjuryPlayerOption[]
  submitting?: boolean
  onClose: () => void
  onCreate: (payload: CreateInjuryRequest) => void
  onUpdate: (payload: UpdateInjuryRequest) => void
}

const emptyValues = (): InjuryFormValues => ({
  playerId: '',
  injuryType: '',
  bodyPart: '',
  severity: 0,
  occurredAt: '',
  estimatedReturnDate: '',
  actualReturnDate: '',
  status: 0,
  medicalNotes: '',
  treatmentNotes: '',
  isMatchInjury: false,
})

export function InjuryDialog({
  open,
  injury,
  players,
  submitting,
  onClose,
  onCreate,
  onUpdate,
}: InjuryDialogProps) {
  const isEdit = Boolean(injury)

  const defaults = useMemo<InjuryFormValues>(() => {
    if (injury) {
      return {
        playerId: injury.playerId,
        injuryType: injury.injuryType,
        bodyPart: injury.bodyPart,
        severity: injury.severity,
        occurredAt: injury.occurredAt?.slice(0, 10) ?? '',
        estimatedReturnDate: injury.estimatedReturnDate?.slice(0, 10) ?? '',
        actualReturnDate: injury.actualReturnDate?.slice(0, 10) ?? '',
        status: injury.status,
        medicalNotes: injury.medicalNotes ?? '',
        treatmentNotes: injury.treatmentNotes ?? '',
        isMatchInjury: injury.isMatchInjury,
      }
    }
    return emptyValues()
  }, [injury])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, InjuryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })

  useEffect(() => {
    if (open) {
      reset(defaults)
    }
  }, [open, reset, defaults])

  const submit = (values: InjuryFormValues) => {
    if (isEdit && injury) {
      onUpdate({
        id: injury.id,
        injuryType: values.injuryType,
        bodyPart: values.bodyPart,
        severity: values.severity,
        estimatedReturnDate: values.estimatedReturnDate || null,
        actualReturnDate: values.actualReturnDate || null,
        status: values.status,
        medicalNotes: values.medicalNotes || null,
        treatmentNotes: values.treatmentNotes || null,
      })
      return
    }

    if (!values.playerId || !values.occurredAt) {
      return
    }

    onCreate({
      playerId: values.playerId,
      injuryType: values.injuryType,
      bodyPart: values.bodyPart,
      severity: values.severity,
      occurredAt: values.occurredAt,
      estimatedReturnDate: values.estimatedReturnDate || null,
      medicalNotes: values.medicalNotes || null,
      treatmentNotes: values.treatmentNotes || null,
      isMatchInjury: values.isMatchInjury,
    })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Edit Injury' : 'Log Injury'}</DialogTitle>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {!isEdit && (
              <Grid size={{ xs: 12 }}>
                <Controller
                  control={control}
                  name="playerId"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Player"
                      fullWidth
                      error={Boolean(errors.playerId)}
                      helperText={errors.playerId?.message}
                    >
                      {players.map((player) => (
                        <MenuItem key={player.playerId} value={player.playerId}>
                          {player.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Injury type"
                fullWidth
                error={Boolean(errors.injuryType)}
                helperText={errors.injuryType?.message}
                {...register('injuryType')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Body part"
                fullWidth
                error={Boolean(errors.bodyPart)}
                helperText={errors.bodyPart?.message}
                {...register('bodyPart')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={control}
                name="severity"
                render={({ field }) => (
                  <TextField {...field} select label="Severity" fullWidth>
                    {injurySeverityNames.map((name, index) => (
                      <MenuItem key={name} value={index}>
                        {name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            {!isEdit ? (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Occurred on"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={Boolean(errors.occurredAt)}
                  helperText={errors.occurredAt?.message}
                  {...register('occurredAt')}
                />
              </Grid>
            ) : (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <TextField {...field} select label="Status" fullWidth>
                      {injuryStatusNames.map((name, index) => (
                        <MenuItem key={name} value={index}>
                          {name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Estimated return"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                {...register('estimatedReturnDate')}
              />
            </Grid>
            {isEdit && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Actual return"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...register('actualReturnDate')}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Medical notes"
                fullWidth
                multiline
                minRows={2}
                {...register('medicalNotes')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Treatment notes"
                fullWidth
                multiline
                minRows={2}
                {...register('treatmentNotes')}
              />
            </Grid>
            {!isEdit && (
              <Grid size={{ xs: 12 }}>
                <Controller
                  control={control}
                  name="isMatchInjury"
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Occurred during a match"
                    />
                  )}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {isEdit ? 'Save' : 'Log injury'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
