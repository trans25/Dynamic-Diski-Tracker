import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { useNotify } from '../../components/NotificationProvider'
import { extractErrorMessage } from '../../api/apiClient'
import {
  useCoachTeams,
  useCoachTemplates,
  useMatchHistory,
  useMatchMutations,
  useUpcomingFixtures,
} from '../../hooks/useCoach'
import { NewMatchDialog, type NewMatchFormValues } from './NewMatchDialog'
import { formatDate } from '../../utils/format'
import { fixtureTypeToName, formatTime } from '../../utils/coachFormat'
import type { FixtureViewModel, UpdateFixtureRequest } from '../../api/types'

function byFixtureDateAsc(a: FixtureViewModel, b: FixtureViewModel): number {
  return new Date(a.fixtureDate).getTime() - new Date(b.fixtureDate).getTime()
}

export function CoachSchedulePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FixtureViewModel | null>(null)
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set())
  const [showPast, setShowPast] = useState(false)
  const notify = useNotify()

  const teamsQuery = useCoachTeams()
  const templatesQuery = useCoachTemplates()
  const upcomingQuery = useUpcomingFixtures()
  const historyQuery = useMatchHistory()
  const { createMatch, updateMatch, deleteMatch } = useMatchMutations()

  const upcoming = useMemo(() => [...(upcomingQuery.data ?? [])].sort(byFixtureDateAsc), [upcomingQuery.data])
  const past = useMemo(() => [...(historyQuery.data ?? [])].sort((a, b) => byFixtureDateAsc(b, a)), [historyQuery.data])

  useEffect(() => {
    const quick = searchParams.get('quick')
    if (quick !== 'new-match') return
    setEditing(null)
    setDialogOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('quick')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (fixture: FixtureViewModel) => {
    setEditing(fixture)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
  }

  const handleCreate = async (values: NewMatchFormValues, seasonId: string) => {
    try {
      await createMatch.mutateAsync({
        teamId: values.teamId,
        seasonId,
        fixtureDate: values.fixtureDate,
        startTime: values.startTime.length === 5 ? `${values.startTime}:00` : values.startTime,
        endTime: values.endTime
          ? values.endTime.length === 5
            ? `${values.endTime}:00`
            : values.endTime
          : null,
        venue: values.venue || null,
        opponent: values.isTraining ? null : values.opponent || null,
        type: values.type,
        isTraining: values.isTraining,
      })
      notify('Event created.', 'success')
      closeDialog()
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleUpdate = async (payload: UpdateFixtureRequest) => {
    try {
      await updateMatch.mutateAsync(payload)
      notify('Event updated.', 'success')
      closeDialog()
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleConfirm = (fixture: FixtureViewModel) => {
    setConfirmedIds((prev) => {
      const next = new Set(prev)
      next.add(fixture.id)
      return next
    })
    notify('Event confirmed.', 'success')
  }

  const handleDelete = async (fixture: FixtureViewModel) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return
    try {
      await deleteMatch.mutateAsync(fixture.id)
      notify('Event deleted.', 'success')
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  return (
    <>
      <PageHeader
        title="Match Center"
        description="Timeline view for upcoming fixtures with fast access to tactical setup and results history."
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            disabled={!teamsQuery.data || teamsQuery.data.length === 0}
          >
            New Match
          </Button>
        }
      />

      {upcomingQuery.isLoading ? (
        <LoadingState label="Loading match timeline..." />
      ) : upcomingQuery.isError ? (
        <ErrorState message={extractErrorMessage(upcomingQuery.error)} onRetry={upcomingQuery.refetch} />
      ) : (
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                Upcoming Matches Timeline
              </Typography>
              {upcoming.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">No upcoming events scheduled.</Typography>
                </Paper>
              ) : (
                <Stack spacing={1.25}>
                  {upcoming.map((fixture, index) => (
                    <Box key={fixture.id} sx={{ display: 'flex', gap: 1.5 }}>
                      <Box sx={{ pt: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
                        {index < upcoming.length - 1 ? <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', mt: 0.4 }} /> : null}
                      </Box>

                      <Card variant="outlined" className="coach-interactive-card" sx={{ flex: 1 }}>
                        <CardContent sx={{ py: '14px !important' }}>
                          <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            spacing={1.25}
                            sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
                          >
                            <Box>
                              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <Chip
                                  size="small"
                                  color={fixture.isTraining ? 'default' : 'secondary'}
                                  label={fixture.isTraining ? 'Training' : fixtureTypeToName(fixture.type)}
                                />
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                  {fixture.opponent || (fixture.isTraining ? 'Training Session' : 'Fixture')}
                                </Typography>
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {formatDate(fixture.fixtureDate)} at {formatTime(fixture.startTime)}
                                {fixture.venue ? ` · ${fixture.venue}` : ''}
                              </Typography>
                            </Box>

                            <Stack direction="row" spacing={0.5}>
                              <Button
                                size="small"
                                variant={confirmedIds.has(fixture.id) ? 'outlined' : 'contained'}
                                startIcon={<CheckIcon />}
                                onClick={() => handleConfirm(fixture)}
                                disabled={confirmedIds.has(fixture.id)}
                              >
                                {confirmedIds.has(fixture.id) ? 'Confirmed' : 'Confirm'}
                              </Button>
                              {!fixture.isTraining ? (
                                <Button
                                  size="small"
                                  component={RouterLink}
                                  to={`/coach/match-ops/${fixture.id}?teamId=${encodeURIComponent(fixture.teamId)}`}
                                >
                                  Lineup Builder
                                </Button>
                              ) : null}
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => openEdit(fixture)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" onClick={() => handleDelete(fixture)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Past Results
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Collapse/expand previous fixtures and scores.
                  </Typography>
                </Box>
                <IconButton onClick={() => setShowPast((prev) => !prev)}>
                  {showPast ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Stack>
              <Collapse in={showPast}>
                <Divider sx={{ my: 1.25 }} />
                {historyQuery.isLoading ? (
                  <Typography variant="body2" color="text.secondary">Loading past results...</Typography>
                ) : historyQuery.isError ? (
                  <AlertRow text={extractErrorMessage(historyQuery.error)} />
                ) : past.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No previous results available.</Typography>
                ) : (
                  <List disablePadding>
                    {past.map((fixture) => (
                      <ListItem key={fixture.id} disableGutters sx={{ py: 0.85 }}>
                        <ListItemText
                          primary={fixture.opponent || (fixture.isTraining ? 'Training Session' : 'Fixture')}
                          secondary={`${formatDate(fixture.fixtureDate)} · ${fixture.homeScore ?? '-'} : ${fixture.awayScore ?? '-'} · ${fixture.venue || 'Venue TBC'}`}
                        />
                        <Chip
                          size="small"
                          label={fixture.result != null ? 'Final' : 'Played'}
                          color={fixture.result != null ? 'primary' : 'default'}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Collapse>
            </CardContent>
          </Card>
        </Stack>
      )}

      <NewMatchDialog
        open={dialogOpen}
        teams={teamsQuery.data ?? []}
        variant="event"
        fixture={editing}
        templates={templatesQuery.data ?? []}
        submitting={createMatch.isPending || updateMatch.isPending}
        onClose={closeDialog}
        onSubmit={handleCreate}
        onUpdate={handleUpdate}
      />
    </>
  )
}

function AlertRow({ text }: { text: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.25 }}>
      <Typography variant="body2" color="error.main">
        {text}
      </Typography>
    </Paper>
  )
}
