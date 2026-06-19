import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Pagination,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { extractErrorMessage } from '../../api/apiClient'
import {
  useCoachInjuries,
  useCoachRoster,
  useCoachTeams,
  useInjuryMutations,
} from '../../hooks/useCoach'
import { formatDate } from '../../utils/format'
import {
  injurySeverityToName,
  injuryStatusToName,
} from '../../utils/coachFormat'
import type {
  CreateInjuryRequest,
  InjuryViewModel,
  UpdateInjuryRequest,
} from '../../api/types'
import { InjuryDialog } from './InjuryDialog'

const severityColor = (severity: number): 'success' | 'warning' | 'error' => {
  if (severity >= 2) return 'error'
  if (severity === 1) return 'warning'
  return 'success'
}

const statusColor = (status: number): 'error' | 'warning' | 'success' => {
  if (status === 0) return 'error'
  if (status === 1) return 'warning'
  return 'success'
}

export function CoachInjuriesPage() {
  const teamsQuery = useCoachTeams()
  const [teamId, setTeamId] = useState<string>('')
  const [filter, setFilter] = useState<'all' | 'active' | 'recovering' | 'cleared'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 6

  useEffect(() => {
    if (!teamId && teamsQuery.data && teamsQuery.data.length > 0) {
      setTeamId(teamsQuery.data[0].id)
    }
  }, [teamId, teamsQuery.data])

  const injuriesQuery = useCoachInjuries()
  const rosterQuery = useCoachRoster(teamId || undefined)
  const { createInjury, updateInjury, deleteInjury } = useInjuryMutations()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<InjuryViewModel | null>(null)

  const players = useMemo(
    () =>
      (rosterQuery.data ?? []).map((p) => ({
        playerId: p.playerId,
        name: `${p.firstName} ${p.lastName}`.trim(),
      })),
    [rosterQuery.data]
  )

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (injury: InjuryViewModel) => {
    setEditing(injury)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
  }

  const handleCreate = (payload: CreateInjuryRequest) => {
    createInjury.mutate(payload, { onSuccess: closeDialog })
  }

  const handleUpdate = (payload: UpdateInjuryRequest) => {
    updateInjury.mutate(payload, { onSuccess: closeDialog })
  }

  const handleDelete = (injury: InjuryViewModel) => {
    if (window.confirm('Delete this injury record? This cannot be undone.')) {
      deleteInjury.mutate(injury.id)
    }
  }

  const injuries = injuriesQuery.data ?? []
  const activeCount = injuries.filter((injury) => injury.status === 0).length
  const recoveringCount = injuries.filter((injury) => injury.status === 1).length
  const clearedCount = injuries.filter((injury) => injury.status === 2).length

  const visibleInjuries = injuries.filter((injury) => {
    const search = searchQuery.trim().toLowerCase()
    const matchesSearch =
      search.length === 0 ||
      injury.injuryType.toLowerCase().includes(search) ||
      injury.bodyPart.toLowerCase().includes(search)
    if (filter === 'all') return matchesSearch
    if (filter === 'active') return injury.status === 0 && matchesSearch
    if (filter === 'recovering') return injury.status === 1 && matchesSearch
    if (filter === 'cleared') return injury.status === 2 && matchesSearch
    return matchesSearch
  })
  const pageCount = Math.max(1, Math.ceil(visibleInjuries.length / pageSize))
  const pagedInjuries = visibleInjuries.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      <PageHeader
        title="Injury & Wellness Tracker"
        description="Monitor player health and manage return-to-play decisions"
        action={
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Injury type or body part"
              sx={{ minWidth: 220 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
              disabled={!teamId || (rosterQuery.data ?? []).length === 0}
            >
              Log Injury
            </Button>
          </Stack>
        }
      />

      {injuriesQuery.isLoading ? (
        <LoadingState label="Loading injuries…" />
      ) : injuriesQuery.isError ? (
        <ErrorState
          message={extractErrorMessage(injuriesQuery.error)}
          onRetry={injuriesQuery.refetch}
        />
      ) : (
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined" className="coach-interactive-card">
                <CardContent>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        ACTIVE INJURIES
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main' }}>
                        {activeCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Require immediate attention
                      </Typography>
                    </Box>
                    <WarningAmberIcon color="error" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined" className="coach-interactive-card">
                <CardContent>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        IN RECOVERY
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: 'warning.main' }}>
                        {recoveringCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Monitoring progress
                      </Typography>
                    </Box>
                    <MonitorHeartOutlinedIcon color="warning" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined" className="coach-interactive-card">
                <CardContent>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        CLEARED THIS MONTH
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main' }}>
                        {clearedCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Return to play approved
                      </Typography>
                    </Box>
                    <CheckCircleIcon color="success" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Stack direction="row" spacing={1}>
            <Chip
              clickable
              color={filter === 'all' ? 'primary' : 'default'}
              label="All"
              onClick={() => setFilter('all')}
            />
            <Chip
              clickable
              color={filter === 'active' ? 'primary' : 'default'}
              label="Active"
              onClick={() => setFilter('active')}
            />
            <Chip
              clickable
              color={filter === 'recovering' ? 'primary' : 'default'}
              label="Recovering"
              onClick={() => setFilter('recovering')}
            />
            <Chip
              clickable
              color={filter === 'cleared' ? 'primary' : 'default'}
              label="Cleared"
              onClick={() => setFilter('cleared')}
            />
          </Stack>

          <Card variant="outlined" className="coach-interactive-card">
            <CardContent>
              {visibleInjuries.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No injury records. Great news!
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {pagedInjuries.map((injury) => (
                    <Card key={injury.id} variant="outlined" className="coach-interactive-card">
                      <CardContent sx={{ py: 1.5 }}>
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          spacing={1.25}
                          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
                        >
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {injury.injuryType} · {injury.bodyPart}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Occurred {formatDate(injury.occurredAt)}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Chip
                              size="small"
                              color={severityColor(injury.severity)}
                              label={injurySeverityToName(injury.severity)}
                            />
                            <Chip
                              size="small"
                              variant="outlined"
                              color={statusColor(injury.status)}
                              label={injuryStatusToName(injury.status)}
                            />
                            <Button size="small" onClick={() => openEdit(injury)}>
                              Edit
                            </Button>
                            <Button size="small" color="error" onClick={() => handleDelete(injury)}>
                              Delete
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                  {visibleInjuries.length > pageSize ? (
                    <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 1 }}>
                      <Pagination count={pageCount} page={page} onChange={(_e, value) => setPage(value)} color="primary" />
                    </Stack>
                  ) : null}
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card className="coach-interactive-card" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Return-to-Play Protocol
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.95 }}>
                Always consult with a medical professional before clearing a player.
                Use the status system to track recovery stages and ensure safe
                return decisions.
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Chip size="small" label="Minor: 1-3 days" sx={{ color: 'inherit' }} />
                <Chip size="small" label="Moderate: 1-2 weeks" sx={{ color: 'inherit' }} />
                <Chip size="small" label="Severe: 4+ weeks" sx={{ color: 'inherit' }} />
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}

      <InjuryDialog
        open={dialogOpen}
        injury={editing}
        players={players}
        submitting={createInjury.isPending || updateInjury.isPending}
        onClose={closeDialog}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </>
  )
}
