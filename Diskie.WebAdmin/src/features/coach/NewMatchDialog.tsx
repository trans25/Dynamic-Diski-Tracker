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
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { fixtureResultNames, fixtureTypeNames } from '../../api/types'
import type {
  CoachTeamViewModel,
  FixtureViewModel,
  MatchStatField,
  SportTemplateViewModel,
  UpdateFixtureRequest,
} from '../../api/types'

const schema = z.object({
  teamId: z.string().min(1, 'Select a team.'),
  fixtureDate: z.string().min(1, 'Date is required.'),
  startTime: z.string().min(1, 'Start time is required.'),
  endTime: z.string().optional(),
  venue: z.string().optional(),
  opponent: z.string().optional(),
  type: z.coerce.number().int().min(0),
  isTraining: z.boolean(),
  result: z.string().optional(),
  homeScore: z.string().optional(),
  awayScore: z.string().optional(),
  matchReport: z.string().optional(),
  possession: z.string().optional(),
  passAccuracy: z.string().optional(),
  shots: z.string().optional(),
  topPerformer: z.string().optional(),
})

export type NewMatchFormValues = z.infer<typeof schema>

const toTimeInput = (value?: string | null) =>
  value ? value.slice(0, 5) : ''

const toTimeApi = (value?: string) =>
  value ? (value.length === 5 ? `${value}:00` : value) : ''

type NewMatchDialogProps = {
  open: boolean
  teams: CoachTeamViewModel[]
  variant?: 'event' | 'match'
  fixture?: FixtureViewModel | null
  templates?: SportTemplateViewModel[]
  submitting?: boolean
  onClose: () => void
  onSubmit: (values: NewMatchFormValues, seasonId: string) => void
  onUpdate?: (payload: UpdateFixtureRequest) => void
}

export function NewMatchDialog({
  open,
  teams,
  variant = 'event',
  fixture,
  templates,
  submitting,
  onClose,
  onSubmit,
  onUpdate,
}: NewMatchDialogProps) {
  const isEdit = Boolean(fixture)
  const isEventDialog = variant === 'event'

  const defaults = useMemo<z.input<typeof schema>>(() => {
    if (fixture) {
      return {
        teamId: fixture.teamId,
        fixtureDate: fixture.fixtureDate?.slice(0, 10) ?? '',
        startTime: toTimeInput(fixture.startTime),
        endTime: toTimeInput(fixture.endTime),
        venue: fixture.venue ?? '',
        opponent: fixture.opponent ?? '',
        type: fixture.type,
        isTraining: fixture.isTraining,
        result: fixture.result != null ? String(fixture.result) : '',
        homeScore: fixture.homeScore != null ? String(fixture.homeScore) : '',
        awayScore: fixture.awayScore != null ? String(fixture.awayScore) : '',
        matchReport: fixture.matchReport ?? '',
        possession: '',
        passAccuracy: '',
        shots: '',
        topPerformer: '',
      }
    }
    return {
      teamId: teams[0]?.id ?? '',
      fixtureDate: '',
      startTime: isEventDialog ? '' : '12:00',
      endTime: '',
      venue: '',
      opponent: '',
      type: 0,
      isTraining: isEventDialog,
      result: '',
      homeScore: '',
      awayScore: '',
      matchReport: '',
      possession: '',
      passAccuracy: '',
      shots: '',
      topPerformer: '',
    }
  }, [fixture, teams, isEventDialog])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, NewMatchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })

  useEffect(() => {
    if (open) {
      reset(defaults)
    }
  }, [open, reset, defaults])

  const selectedTeamId = watch('teamId')
  const selectedTemplate = templates?.find(
    (template) => template.id === teams.find((team) => team.id === selectedTeamId)?.sportTemplateId
  )
  const dynamicStats: MatchStatField[] = selectedTemplate?.matchStatsFields?.slice(0, 3) ?? []
  const statOneLabel = dynamicStats[0]?.displayName || 'Possession %'
  const statTwoLabel = dynamicStats[1]?.displayName || 'Pass Accuracy %'
  const statThreeLabel = dynamicStats[2]?.displayName || 'Shots'

  const submit = (values: NewMatchFormValues) => {
    const resolvedIsTraining = isEventDialog && values.type === 0
    const resolvedStartTime = values.startTime || '12:00'

    const parsedHome =
      values.homeScore !== undefined && values.homeScore !== ''
        ? Number(values.homeScore)
        : null
    const parsedAway =
      values.awayScore !== undefined && values.awayScore !== ''
        ? Number(values.awayScore)
        : null
    const parsedResult =
      values.result !== undefined && values.result !== ''
        ? Number(values.result)
        : null

    const reportSections = [
      values.matchReport?.trim(),
      values.topPerformer?.trim() ? `Top Performer: ${values.topPerformer.trim()}` : '',
      values.possession?.trim() ? `Possession: ${values.possession.trim()}%` : '',
      values.passAccuracy?.trim()
        ? `Pass Accuracy: ${values.passAccuracy.trim()}%`
        : '',
      values.shots?.trim() ? `Shots: ${values.shots.trim()}` : '',
    ].filter(Boolean)

    const combinedReport = reportSections.length > 0 ? reportSections.join('\n') : ''

    if (isEdit && fixture && onUpdate) {
      onUpdate({
        id: fixture.id,
        teamId: values.teamId,
        seasonId:
          teams.find((t) => t.id === values.teamId)?.seasonId ??
          fixture.seasonId,
        fixtureDate: values.fixtureDate,
        startTime: toTimeApi(resolvedStartTime),
        endTime: values.endTime ? toTimeApi(values.endTime) : null,
        venue: values.venue || null,
        opponent: resolvedIsTraining ? null : values.opponent || null,
        type: values.type,
        result: parsedResult,
        homeScore: parsedHome,
        awayScore: parsedAway,
        matchReport: combinedReport || null,
        isTraining: resolvedIsTraining,
        isCancelled: fixture.isCancelled,
      })
      return
    }

    const season = teams.find((t) => t.id === values.teamId)?.seasonId ?? ''
    onSubmit(
      {
        ...values,
        startTime: resolvedStartTime,
        isTraining: resolvedIsTraining,
        matchReport: combinedReport,
      },
      season
    )
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEventDialog
          ? isEdit
            ? 'Edit Event'
            : 'New Event'
          : 'Record New Match'}
      </DialogTitle>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {teams.length > 1 ? (
              <Grid size={{ xs: 12 }}>
                <Controller
                  control={control}
                  name="teamId"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Team"
                      fullWidth
                      error={Boolean(errors.teamId)}
                      helperText={errors.teamId?.message}
                    >
                      {teams.map((team) => (
                        <MenuItem key={team.id} value={team.id}>
                          {team.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            ) : null}

            {isEventDialog ? (
              <>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Title"
                    fullWidth
                    placeholder="e.g. Practice Session"
                    error={Boolean(errors.opponent)}
                    helperText={errors.opponent?.message}
                    {...register('opponent')}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        label="Type"
                        fullWidth
                        onChange={(e) => {
                          const nextType = Number(e.target.value)
                          field.onChange(nextType)
                        }}
                      >
                        <MenuItem value={0}>Practice</MenuItem>
                        {fixtureTypeNames.map((name, index) => (
                          <MenuItem key={name} value={index}>
                            {name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Date"
                    type="date"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={Boolean(errors.fixtureDate)}
                    helperText={errors.fixtureDate?.message}
                    {...register('fixtureDate')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Time"
                    type="time"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={Boolean(errors.startTime)}
                    helperText={errors.startTime?.message}
                    {...register('startTime')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Venue" fullWidth {...register('venue')} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Notes"
                    fullWidth
                    multiline
                    minRows={2}
                    {...register('matchReport')}
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Opponent"
                    placeholder="e.g. Orlando Juniors"
                    fullWidth
                    error={Boolean(errors.opponent)}
                    helperText={errors.opponent?.message}
                    {...register('opponent')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Date"
                    type="date"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={Boolean(errors.fixtureDate)}
                    helperText={errors.fixtureDate?.message}
                    {...register('fixtureDate')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Venue" fullWidth {...register('venue')} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField label="Our Score" type="number" fullWidth {...register('homeScore')} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField label="Their Score" type="number" fullWidth {...register('awayScore')} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    control={control}
                    name="result"
                    render={({ field }) => (
                      <TextField {...field} select label="Result" fullWidth>
                        <MenuItem value="">Not played</MenuItem>
                        {fixtureResultNames.map((name, index) => (
                          <MenuItem key={name} value={String(index)}>
                            {name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label={statOneLabel}
                    type="number"
                    fullWidth
                    {...register('possession')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label={statTwoLabel}
                    type="number"
                    fullWidth
                    {...register('passAccuracy')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label={statThreeLabel} type="number" fullWidth {...register('shots')} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField label="Top Performer" fullWidth {...register('topPerformer')} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Notes"
                    fullWidth
                    multiline
                    minRows={2}
                    {...register('matchReport')}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Time is optional for recorded match history entries.
                    </Typography>
                  </Stack>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !selectedTeamId}
          >
            {isEventDialog ? (isEdit ? 'Save Event' : 'Create Event') : 'Record Match'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
