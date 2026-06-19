import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Drawer,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import InsightsIcon from '@mui/icons-material/Insights'
import DownloadIcon from '@mui/icons-material/Download'
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { useNotify } from '../../components/NotificationProvider'
import { extractErrorMessage } from '../../api/apiClient'
import {
  useCoachRoster,
  useCoachTeams,
  useCoachTemplates,
  useCsvImportMutation,
  useRosterMutations,
  useTeamMutations,
} from '../../hooks/useCoach'
import { AddPlayerDialog, type AddPlayerFormValues } from './AddPlayerDialog'
import { EditPlayerDialog, type EditPlayerFormValues } from './EditPlayerDialog'
import { CreateTeamDialog, type CreateTeamFormValues } from './CreateTeamDialog'
import { EditTeamDialog, type EditTeamFormValues } from './EditTeamDialog'
import { ImportPlayersDialog } from './ImportPlayersDialog'
import {
  InviteGuardianDialog,
  type InviteGuardianFormValues,
} from './InviteGuardianDialog'
import { PlayerPerformanceDialog } from './PlayerPerformanceDialog'
import type { RosterPlayerViewModel } from '../../api/types'

type SquadFilter = 'all' | 'fit' | 'injured' | 'suspended' | 'academy'

const positionBuckets = ['ALL', 'GK', 'DEF', 'MID', 'FWD']

function getPlayerStatus(player: RosterPlayerViewModel): 'Fit' | 'Injured' | 'Suspended' {
  if (!player.isActive) return 'Suspended'
  if (player.hasActiveInjury) return 'Injured'
  return 'Fit'
}

function getStatusColor(status: 'Fit' | 'Injured' | 'Suspended'): 'success' | 'error' | 'warning' {
  if (status === 'Fit') return 'success'
  if (status === 'Injured') return 'error'
  return 'warning'
}

function normalizePosition(position?: string | null): string {
  return (position ?? '').trim().toUpperCase()
}

function positionGroup(position?: string | null): 'GK' | 'DEF' | 'MID' | 'FWD' | 'OTHER' {
  const normalized = normalizePosition(position)
  if (normalized === 'GK' || normalized.includes('GOALKEEPER')) return 'GK'
  if (['LB', 'LCB', 'CB', 'RCB', 'RB', 'LWB', 'RWB'].some((key) => normalized.includes(key))) return 'DEF'
  if (['CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'LAM', 'RAM'].some((key) => normalized.includes(key))) return 'MID'
  if (['ST', 'CF', 'FW'].some((key) => normalized.includes(key))) return 'FWD'
  return 'OTHER'
}

export function CoachTeamsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const teamsQuery = useCoachTeams()
  const templatesQuery = useCoachTemplates()
  const [teamId, setTeamId] = useState<string | undefined>()
  const notify = useNotify()

  useEffect(() => {
    if (!teamId && teamsQuery.data && teamsQuery.data.length > 0) {
      setTeamId(teamsQuery.data[0].id)
    }
  }, [teamId, teamsQuery.data])

  const rosterQuery = useCoachRoster(teamId)
  const csvImport = useCsvImportMutation(teamId)
  const { addPlayer, updatePlayer, removePlayer, importPlayers, inviteGuardian } = useRosterMutations(teamId)
  const { createTeam, updateTeam, deleteTeam } = useTeamMutations()

  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [createTeamOpen, setCreateTeamOpen] = useState(false)
  const [editTeamOpen, setEditTeamOpen] = useState(false)
  const [editPlayer, setEditPlayer] = useState<RosterPlayerViewModel | null>(null)
  const [guardianFor, setGuardianFor] = useState<RosterPlayerViewModel | null>(null)
  const [profilePlayer, setProfilePlayer] = useState<RosterPlayerViewModel | null>(null)
  const [perfPlayerId, setPerfPlayerId] = useState<string | undefined>()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<SquadFilter>('all')
  const [positionFilter, setPositionFilter] = useState('ALL')

  useEffect(() => {
    const queryPlayerId = searchParams.get('playerId')
    if (queryPlayerId) setPerfPlayerId(queryPlayerId)

    const quick = searchParams.get('quick')
    if (quick === 'add-player') {
      setAddOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('quick')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const closePerformanceDialog = () => {
    setPerfPlayerId(undefined)
    if (!searchParams.get('playerId')) return
    const next = new URLSearchParams(searchParams)
    next.delete('playerId')
    setSearchParams(next, { replace: true })
  }

  const selectedTeam = teamsQuery.data?.find((team) => team.id === teamId)

  const positionOptions = useMemo(() => {
    const template = templatesQuery.data?.find((template) => template.id === selectedTeam?.sportTemplateId)
    return template?.positionOptions ?? null
  }, [templatesQuery.data, selectedTeam])

  const filteredRoster = useMemo(() => {
    const rows = rosterQuery.data ?? []
    const text = searchText.trim().toLowerCase()

    return rows.filter((player) => {
      const fullName = `${player.firstName} ${player.lastName}`.trim().toLowerCase()
      const status = getPlayerStatus(player)
      const isAcademy = (player.teamRole ?? '').toLowerCase().includes('academy')
      const posGroup = positionGroup(player.position)

      const matchesSearch =
        text.length === 0 ||
        fullName.includes(text) ||
        (player.position ?? '').toLowerCase().includes(text) ||
        String(player.jerseyNumber ?? '').includes(text)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'fit' && status === 'Fit') ||
        (statusFilter === 'injured' && status === 'Injured') ||
        (statusFilter === 'suspended' && status === 'Suspended') ||
        (statusFilter === 'academy' && isAcademy)

      const matchesPosition =
        positionFilter === 'ALL' ||
        posGroup === positionFilter ||
        normalizePosition(player.position) === positionFilter

      return matchesSearch && matchesStatus && matchesPosition
    })
  }, [positionFilter, rosterQuery.data, searchText, statusFilter])

  const handleCreateTeam = async (values: CreateTeamFormValues) => {
    try {
      const team = await createTeam.mutateAsync({
        sportTemplateId: values.sportTemplateId,
        name: values.name,
        ageGroup: values.ageGroup || null,
        genderCategory: values.genderCategory || null,
        level: values.level || null,
      })
      notify('Team created.', 'success')
      setCreateTeamOpen(false)
      setTeamId(team.id)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleEditTeam = async (values: EditTeamFormValues) => {
    if (!selectedTeam) return
    try {
      await updateTeam.mutateAsync({
        id: selectedTeam.id,
        name: values.name,
        ageGroup: values.ageGroup || null,
        genderCategory: values.genderCategory || null,
        level: values.level || null,
        isActive: values.isActive,
      })
      notify('Team updated.', 'success')
      setEditTeamOpen(false)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return
    if (!window.confirm(`Delete team "${selectedTeam.name}"? This cannot be undone.`)) return

    try {
      await deleteTeam.mutateAsync(selectedTeam.id)
      notify('Team deleted.', 'success')
      setTeamId(undefined)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleAddPlayer = async (values: AddPlayerFormValues) => {
    try {
      await addPlayer.mutateAsync({
        fullName: values.fullName,
        position: values.position || null,
        jerseyNumber: values.jerseyNumber != null && !Number.isNaN(values.jerseyNumber) ? values.jerseyNumber : null,
        dateOfBirth: values.dateOfBirth || null,
        guardianName: values.guardianName || null,
        guardianEmail: values.guardianEmail || null,
        guardianPhone: values.guardianPhone || null,
      })
      notify('Player added to roster.', 'success')
      setAddOpen(false)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleImport = async (rows: import('../../api/types').ImportPlayerRow[]) => {
    try {
      const result = await importPlayers.mutateAsync({ players: rows })
      notify(
        `Imported ${result.createdCount} player(s)` + (result.failedCount > 0 ? `, ${result.failedCount} failed.` : '.'),
        result.failedCount > 0 ? 'warning' : 'success',
      )
      setImportOpen(false)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleInviteGuardian = async (values: InviteGuardianFormValues) => {
    if (!guardianFor) return

    try {
      await inviteGuardian.mutateAsync({
        playerId: guardianFor.playerId,
        guardianName: values.guardianName,
        guardianEmail: values.guardianEmail,
        guardianPhone: values.guardianPhone || null,
        relationship: values.relationship || null,
        isPrimary: values.isPrimary,
      })
      notify('Guardian invited.', 'success')
      setGuardianFor(null)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleUploadCsv = async (file: File) => {
    try {
      const result = await csvImport.mutateAsync(file)
      notify(
        `Imported ${result.importedCount} player(s)` +
          (result.duplicateCount > 0 ? `, ${result.duplicateCount} duplicate(s) skipped.` : '.'),
        result.duplicateCount > 0 ? 'warning' : 'success',
      )
      if (result.errors.length > 0) {
        notify(result.errors[0], 'warning')
      }
      setImportOpen(false)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleEditPlayer = async (values: EditPlayerFormValues) => {
    if (!editPlayer) return

    try {
      await updatePlayer.mutateAsync({
        playerId: editPlayer.playerId,
        payload: {
          fullName: values.fullName,
          position: values.position || null,
          jerseyNumber: values.jerseyNumber != null && !Number.isNaN(values.jerseyNumber) ? values.jerseyNumber : null,
          teamRole: values.teamRole || null,
          isActive: values.isActive,
        },
      })
      notify('Player updated.', 'success')
      setEditPlayer(null)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleRemovePlayer = async (player: RosterPlayerViewModel) => {
    if (!window.confirm(`Remove ${player.firstName} ${player.lastName} from this team?`)) return

    try {
      await removePlayer.mutateAsync(player.playerId)
      notify('Player removed from team.', 'success')
      setProfilePlayer(null)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleExportCsv = () => {
    const rows = rosterQuery.data ?? []
    if (rows.length === 0) return

    const header = ['First Name', 'Last Name', 'Email', 'Phone', 'Jersey Number', 'Position', 'Status']
    const csvRows = rows.map((row) => [
      row.firstName,
      row.lastName,
      row.email ?? '',
      row.phone ?? '',
      row.jerseyNumber ?? '',
      row.position ?? '',
      row.hasActiveInjury ? 'Injured' : row.isActive ? 'Fit' : 'Suspended',
    ])

    const content = [header, ...csvRows]
      .map((row) => row.map((value) => `"${String(value).split('"').join('""')}"`).join(','))
      .join('\n')

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedTeam?.name ?? 'roster'}-players.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (teamsQuery.isLoading) {
    return <LoadingState label="Loading your teams..." />
  }

  if (teamsQuery.isError) {
    return (
      <>
        <PageHeader title="Squad" />
        <ErrorState message={extractErrorMessage(teamsQuery.error)} onRetry={teamsQuery.refetch} />
      </>
    )
  }

  if (!teamsQuery.data || teamsQuery.data.length === 0) {
    return (
      <>
        <PageHeader title="Squad" description="Create your first team to start managing players." />
        <EmptyState
          title="No teams yet"
          description="Create a team from one of your sport templates."
          action={
            <Button variant="contained" startIcon={<GroupAddIcon />} onClick={() => setCreateTeamOpen(true)}>
              Create Team
            </Button>
          }
        />

        <CreateTeamDialog
          open={createTeamOpen}
          templates={templatesQuery.data ?? []}
          templatesLoading={templatesQuery.isLoading}
          submitting={createTeam.isPending}
          onClose={() => setCreateTeamOpen(false)}
          onSubmit={handleCreateTeam}
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Squad Management"
        description="Card-based squad workflow for touchline decisions and player management."
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<GroupAddIcon />} onClick={() => setCreateTeamOpen(true)}>
              New Team
            </Button>
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setImportOpen(true)} disabled={!teamId}>
              Import CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportCsv}
              disabled={!rosterQuery.data || rosterQuery.data.length === 0}
            >
              Export CSV
            </Button>
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setAddOpen(true)} disabled={!teamId}>
              Add Player
            </Button>
          </Stack>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' } }}>
            <TextField
              select
              size="small"
              label="Team"
              value={teamId ?? ''}
              onChange={(event) => setTeamId(event.target.value)}
              sx={{ minWidth: 280 }}
            >
              {teamsQuery.data.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name} ({team.playerCount})
                </MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => setEditTeamOpen(true)} disabled={!selectedTeam}>
              Edit Team
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteTeam}
              disabled={!selectedTeam || deleteTeam.isPending}
            >
              Delete Team
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2, position: 'sticky', top: 80, zIndex: 10 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.25} sx={{ alignItems: { lg: 'center' } }}>
            <TextField
              size="small"
              placeholder="Search players by name, number, or position"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              sx={{ minWidth: 280, flex: { lg: 1 } }}
            />
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <FilterChip label="All" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
              <FilterChip label="Fit" active={statusFilter === 'fit'} onClick={() => setStatusFilter('fit')} />
              <FilterChip label="Injured" active={statusFilter === 'injured'} onClick={() => setStatusFilter('injured')} />
              <FilterChip label="Suspended" active={statusFilter === 'suspended'} onClick={() => setStatusFilter('suspended')} />
              <FilterChip label="Academy" active={statusFilter === 'academy'} onClick={() => setStatusFilter('academy')} />
            </Stack>
            <TextField
              select
              size="small"
              label="Position"
              value={positionFilter}
              onChange={(event) => setPositionFilter(event.target.value)}
              sx={{ minWidth: 150 }}
            >
              {positionBuckets.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {rosterQuery.isLoading ? (
        <LoadingState label="Loading squad..." />
      ) : filteredRoster.length === 0 ? (
        <EmptyState title="No players match your filters" description="Adjust filters or add players to this team." />
      ) : (
        <Grid container spacing={1.5}>
          {filteredRoster.map((player) => {
            const fullName = `${player.firstName} ${player.lastName}`.trim()
            const status = getPlayerStatus(player)
            const initials = `${player.firstName?.[0] ?? ''}${player.lastName?.[0] ?? ''}`.toUpperCase()

            return (
              <Grid key={player.playerId} size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                <Card
                  className="coach-interactive-card"
                  data-player-id={player.playerId}
                  onClick={() => setProfilePlayer(player)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 2,
                    height: '100%',
                    borderColor: status === 'Injured' ? 'error.light' : 'divider',
                  }}
                >
                  <CardContent>
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1 }}>
                      <Avatar src={player.profilePhotoUrl ?? undefined} sx={{ bgcolor: 'primary.main' }}>
                        {initials}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                          {fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          #{player.jerseyNumber ?? '--'} · {player.position || 'N/A'}
                        </Typography>
                      </Box>
                      <Chip size="small" color={getStatusColor(status)} label={status} />
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: status === 'Fit' ? 'success.main' : status === 'Injured' ? 'error.main' : 'warning.main',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {status === 'Fit'
                          ? 'Available for selection'
                          : status === 'Injured'
                            ? 'Unavailable due to injury'
                            : 'Selection currently suspended'}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      <Drawer
        anchor="right"
        open={Boolean(profilePlayer)}
        onClose={() => setProfilePlayer(null)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 420 },
          },
        }}
      >
        {profilePlayer ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Player Profile
                </Typography>
                <IconButton size="small" onClick={() => setProfilePlayer(null)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>

            <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
                <Avatar src={profilePlayer.profilePhotoUrl ?? undefined} sx={{ width: 58, height: 58, bgcolor: 'primary.main' }}>
                  {`${profilePlayer.firstName?.[0] ?? ''}${profilePlayer.lastName?.[0] ?? ''}`.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                    {profilePlayer.firstName} {profilePlayer.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    #{profilePlayer.jerseyNumber ?? '--'} · {profilePlayer.position || 'N/A'}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip size="small" label={getPlayerStatus(profilePlayer)} color={getStatusColor(getPlayerStatus(profilePlayer))} />
                <Chip size="small" variant="outlined" label={profilePlayer.isActive ? 'Active Contract' : 'Contract Paused'} />
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Contact
              </Typography>
              <Stack spacing={0.5} sx={{ mb: 2 }}>
                <Typography variant="body2">Email: {profilePlayer.email || 'Not set'}</Typography>
                <Typography variant="body2">Phone: {profilePlayer.phone || 'Not set'}</Typography>
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Contract and Role
              </Typography>
              <Stack spacing={0.5} sx={{ mb: 2 }}>
                <Typography variant="body2">Role: {profilePlayer.teamRole || 'Standard Squad'}</Typography>
                <Typography variant="body2">Contract Type: Academy / First-Team contract inherited from backend profile.</Typography>
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Player Actions
              </Typography>
              <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap' }}>
                <Tooltip title="View performance">
                  <Button size="small" startIcon={<InsightsIcon />} onClick={() => setPerfPlayerId(profilePlayer.playerId)}>
                    Performance
                  </Button>
                </Tooltip>
                <Tooltip title="Edit player">
                  <Button size="small" startIcon={<EditIcon />} onClick={() => setEditPlayer(profilePlayer)}>
                    Edit
                  </Button>
                </Tooltip>
                <Tooltip title="Invite guardian">
                  <Button size="small" startIcon={<FamilyRestroomIcon />} onClick={() => setGuardianFor(profilePlayer)}>
                    Invite Guardian
                  </Button>
                </Tooltip>
                <Tooltip title="Remove from team">
                  <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleRemovePlayer(profilePlayer)}>
                    Remove
                  </Button>
                </Tooltip>
              </Stack>
            </Box>
          </Box>
        ) : null}
      </Drawer>

      <AddPlayerDialog
        open={addOpen}
        teamName={selectedTeam?.name}
        positionOptions={positionOptions}
        submitting={addPlayer.isPending}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddPlayer}
      />

      <EditPlayerDialog
        open={Boolean(editPlayer)}
        player={editPlayer}
        positionOptions={positionOptions}
        submitting={updatePlayer.isPending}
        onClose={() => setEditPlayer(null)}
        onSubmit={handleEditPlayer}
      />

      <CreateTeamDialog
        open={createTeamOpen}
        templates={templatesQuery.data ?? []}
        templatesLoading={templatesQuery.isLoading}
        submitting={createTeam.isPending}
        onClose={() => setCreateTeamOpen(false)}
        onSubmit={handleCreateTeam}
      />

      <EditTeamDialog
        open={editTeamOpen}
        team={selectedTeam}
        submitting={updateTeam.isPending}
        onClose={() => setEditTeamOpen(false)}
        onSubmit={handleEditTeam}
      />

      <ImportPlayersDialog
        open={importOpen}
        submitting={importPlayers.isPending || csvImport.isPending}
        onClose={() => setImportOpen(false)}
        onSubmit={handleImport}
        onUploadFile={handleUploadCsv}
      />

      <InviteGuardianDialog
        open={Boolean(guardianFor)}
        playerName={guardianFor ? `${guardianFor.firstName} ${guardianFor.lastName}` : undefined}
        submitting={inviteGuardian.isPending}
        onClose={() => setGuardianFor(null)}
        onSubmit={handleInviteGuardian}
      />

      <PlayerPerformanceDialog
        open={Boolean(perfPlayerId)}
        playerId={perfPlayerId}
        onClose={closePerformanceDialog}
      />
    </>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <Chip clickable color={active ? 'primary' : 'default'} label={label} onClick={onClick} />
}
