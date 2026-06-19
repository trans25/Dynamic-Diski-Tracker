import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  Divider,
  IconButton,
  InputAdornment,
  Collapse,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import CallIcon from '@mui/icons-material/Call'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SearchIcon from '@mui/icons-material/Search'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { useNotify } from '../../components/NotificationProvider'
import {
  useAvailabilityMutations,
  useCoachRoster,
  useMatchAvailability,
  useSaveTacticalLayout,
  useTacticalLayout,
} from '../../hooks/useCoach'
import { extractErrorMessage } from '../../api/apiClient'

// ---------- Constants & Helpers (unchanged) ----------
const PITCH_WIDTH = 100
const PITCH_HEIGHT = 140
const MAX_STARTERS = 11
const MAX_SUBS = 5
const MAX_MATCHDAY_SQUAD = 16
const MAX_GOALKEEPERS = 2

type Placement = {
  playerId: string
  playerName: string
  x: number
  y: number
}

type DragSource =
  | { kind: 'available'; playerId: string }
  | { kind: 'bench'; playerId: string }
  | { kind: 'field'; playerId: string; slotId: string }

type FormationSlot = {
  id: string
  label: string
  group: 'GK' | 'DEF' | 'MID' | 'FWD'
  x: number
  y: number
}

type FormationOption = {
  id: string
  label: string
  slots: FormationSlot[]
}

type MatchdayStatus = 'Draft' | 'Selection Ready' | 'Announced' | 'Locked'

type MatchdayPlannerState = {
  status: MatchdayStatus
  captainId: string
  viceCaptainId: string
  penaltyTakerId: string
  squadNotes: string
  inPossessionPlan: string
  outOfPossessionPlan: string
  setPieceNotes: string
}

const DEFAULT_FORMATION: FormationOption = {
  id: '4-3-3',
  label: '4-3-3',
  slots: [
    { id: 'gk', label: 'GK', group: 'GK', x: 50, y: 90 },
    { id: 'rb', label: 'RB', group: 'DEF', x: 78, y: 74 },
    { id: 'rcb', label: 'RCB', group: 'DEF', x: 60, y: 74 },
    { id: 'lcb', label: 'LCB', group: 'DEF', x: 40, y: 74 },
    { id: 'lb', label: 'LB', group: 'DEF', x: 22, y: 74 },
    { id: 'rcm', label: 'RCM', group: 'MID', x: 64, y: 56 },
    { id: 'cm', label: 'CM', group: 'MID', x: 50, y: 50 },
    { id: 'lcm', label: 'LCM', group: 'MID', x: 36, y: 56 },
    { id: 'rw', label: 'RW', group: 'FWD', x: 74, y: 30 },
    { id: 'st', label: 'ST', group: 'FWD', x: 50, y: 22 },
    { id: 'lw', label: 'LW', group: 'FWD', x: 26, y: 30 },
  ],
}

const FORMATIONS: FormationOption[] = [
  DEFAULT_FORMATION,
  {
    id: '4-2-3-1',
    label: '4-2-3-1',
    slots: [
      { id: 'gk', label: 'GK', group: 'GK', x: 50, y: 90 },
      { id: 'rb', label: 'RB', group: 'DEF', x: 78, y: 74 },
      { id: 'rcb', label: 'RCB', group: 'DEF', x: 60, y: 74 },
      { id: 'lcb', label: 'LCB', group: 'DEF', x: 40, y: 74 },
      { id: 'lb', label: 'LB', group: 'DEF', x: 22, y: 74 },
      { id: 'rdm', label: 'RDM', group: 'MID', x: 58, y: 58 },
      { id: 'ldm', label: 'LDM', group: 'MID', x: 42, y: 58 },
      { id: 'ram', label: 'RAM', group: 'MID', x: 70, y: 40 },
      { id: 'cam', label: 'CAM', group: 'MID', x: 50, y: 34 },
      { id: 'lam', label: 'LAM', group: 'MID', x: 30, y: 40 },
      { id: 'st', label: 'ST', group: 'FWD', x: 50, y: 20 },
    ],
  },
]

function getFormationById(id: string): FormationOption {
  return FORMATIONS.find((f) => f.id === id) ?? FORMATIONS[0] ?? DEFAULT_FORMATION
}

function createDefaultPlannerState(): MatchdayPlannerState {
  return {
    status: 'Draft',
    captainId: '',
    viceCaptainId: '',
    penaltyTakerId: '',
    squadNotes: '',
    inPossessionPlan: '',
    outOfPossessionPlan: '',
    setPieceNotes: '',
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function normalizePosition(position?: string | null): string {
  return (position ?? 'N/A').trim() || 'N/A'
}

function isGoalkeeper(position?: string | null): boolean {
  const normalized = normalizePosition(position).toUpperCase()
  return normalized === 'GK' || normalized.includes('GOALKEEPER')
}

function getPlayerLabel(firstName?: string | null, lastName?: string | null): string {
  return `${firstName ?? ''} ${lastName ?? ''}`.trim()
}

function getPitchName(firstName?: string | null, lastName?: string | null): string {
  return lastName?.trim() || firstName?.trim() || 'Player'
}

function getJerseyLabel(jerseyNumber?: number | null): string {
  return jerseyNumber != null ? `#${jerseyNumber}` : '#--'
}

function serializeDragSource(source: DragSource): string {
  return JSON.stringify(source)
}

function parseDragSource(value: string): DragSource | null {
  try {
    const parsed = JSON.parse(value) as Partial<DragSource>
    if (!parsed.kind || !parsed.playerId) return null
    if (parsed.kind === 'field' && !parsed.slotId) return null
    return parsed as DragSource
  } catch {
    return null
  }
}

function buildPlacements(formation: FormationOption, fieldAssignments: Record<string, string>): Placement[] {
  return formation.slots
    .map((slot) => {
      const playerId = fieldAssignments[slot.id]
      if (!playerId) return null
      return {
        playerId,
        playerName: slot.label,
        x: clamp(slot.x, 0, PITCH_WIDTH),
        y: clamp((slot.y / 100) * PITCH_HEIGHT, 0, PITCH_HEIGHT),
      }
    })
    .filter((item): item is Placement => Boolean(item))
}

function assignPlayersToFormation(
  playerIds: string[],
  formation: FormationOption,
  playersById: Map<string, { position?: string | null }>,
): Record<string, string> {
  const goalkeeperIds = playerIds.filter((id) => isGoalkeeper(playersById.get(id)?.position))
  const outfieldIds = playerIds.filter((id) => !isGoalkeeper(playersById.get(id)?.position))
  const nextAssignments: Record<string, string> = {}

  for (const slot of formation.slots) {
    if (slot.group === 'GK') {
      const keeper = goalkeeperIds.shift()
      if (keeper) nextAssignments[slot.id] = keeper
      continue
    }
    const playerId = outfieldIds.shift()
    if (playerId) nextAssignments[slot.id] = playerId
  }
  return nextAssignments
}

function buildAssignmentsFromSaved(
  savedPlayers: Placement[],
  formation: FormationOption,
  playersById: Map<string, { position?: string | null }>,
): Record<string, string> {
  const remainingSlots = [...formation.slots]
  const nextAssignments: Record<string, string> = {}

  for (const savedPlayer of savedPlayers) {
    const desiredY = (savedPlayer.y / PITCH_HEIGHT) * 100
    const playerIsGoalkeeper = isGoalkeeper(playersById.get(savedPlayer.playerId)?.position)
    const compatibleSlots = remainingSlots.filter((slot) =>
      slot.group === 'GK' ? playerIsGoalkeeper : !playerIsGoalkeeper,
    )
    if (compatibleSlots.length === 0) continue

    const targetSlot = compatibleSlots.reduce((closest, candidate) => {
      const currentDist = Math.abs(candidate.y - desiredY) + Math.abs(candidate.x - savedPlayer.x)
      const bestDist = Math.abs(closest.y - desiredY) + Math.abs(closest.x - savedPlayer.x)
      return currentDist < bestDist ? candidate : closest
    })

    nextAssignments[targetSlot.id] = savedPlayer.playerId
    const idx = remainingSlots.findIndex((s) => s.id === targetSlot.id)
    if (idx >= 0) remainingSlots.splice(idx, 1)
  }
  return nextAssignments
}

// ---------- Subcomponents (extracted for clarity) ----------

// Squad Selector: availability list with position groups and search
function SquadSelector({
  availability,
  selectedIds,
  onToggleAvailability,
  onRequestAvailability,
}: {
  availability: any[]
  selectedIds: Set<string>
  onToggleAvailability: (playerId: string, checked: boolean) => void
  onRequestAvailability: () => void
}) {
  const [search, setSearch] = useState('')
  const [groupByPosition, setGroupByPosition] = useState(true)

  const filtered = useMemo(() => {
    const lower = search.toLowerCase()
    return availability.filter((item) =>
      item.playerName.toLowerCase().includes(lower) ||
      (item.position && item.position.toLowerCase().includes(lower))
    )
  }, [availability, search])

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = { GK: [], DEF: [], MID: [], FWD: [], Other: [] }
    if (!groupByPosition) return { All: filtered }
    filtered.forEach((item) => {
      const pos = normalizePosition(item.position).toUpperCase()
      if (pos === 'GK') groups.GK.push(item)
      else if (['LB','LCB','CB','RCB','RB','LWB','RWB'].some(p => pos.includes(p))) groups.DEF.push(item)
      else if (['CDM','CM','CAM','LM','RM','LW','RW','LAM','RAM'].some(p => pos.includes(p))) groups.MID.push(item)
      else if (['ST','CF','LW','RW'].some(p => pos.includes(p))) groups.FWD.push(item)
      else groups.Other.push(item)
    })
    // remove empty groups
    return Object.fromEntries(Object.entries(groups).filter(([, arr]) => arr.length > 0))
  }, [filtered, groupByPosition])

  const responseSummary = useMemo(() => {
    const counts = { available: 0, unavailable: 0, noResponse: 0 }
    for (const item of availability) {
      if (item.status === 'Available') counts.available++
      else if (item.status === 'Unavailable') counts.unavailable++
      else counts.noResponse++
    }
    return counts
  }, [availability])

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="1. Pick Available Players"
        subheader="Update player responses and build your selection pool"
        action={
          <Button size="small" startIcon={<CallIcon />} onClick={onRequestAvailability}>
            Request Check-In
          </Button>
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
          <Chip label={`Available ${responseSummary.available}`} color="success" size="small" />
          <Chip label={`Unavailable ${responseSummary.unavailable}`} color="error" size="small" />
          <Chip label={`No Response ${responseSummary.noResponse}`} color="warning" size="small" />
        </Stack>
        <TextField
          size="small"
          placeholder="Search by name or position"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 1 }}
        />
        <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
          <Typography variant="caption">Group by position</Typography>
          <Switch size="small" checked={groupByPosition} onChange={(_, v) => setGroupByPosition(v)} />
        </Stack>
        <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
          {Object.entries(grouped).map(([group, players]) => (
            <Box key={group}>
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5 }}>
                {group}
              </Typography>
              <List dense disablePadding>
                {players.map((item) => {
                  const isSelected = selectedIds.has(item.playerId)
                  return (
                    <ListItem
                      key={item.playerId}
                      secondaryAction={
                        <Switch
                          edge="end"
                          checked={item.status === 'Available'}
                          onChange={(_, checked) => onToggleAvailability(item.playerId, checked)}
                        />
                      }
                      sx={{ opacity: isSelected ? 0.5 : 1 }}
                    >
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 500 }}>{item.playerName}</Typography>}
                        secondary={<Typography variant="caption">{`${getJerseyLabel(item.jerseyNumber)} · ${normalizePosition(item.position)}`}</Typography>}
                      />
                    </ListItem>
                  )
                })}
              </List>
            </Box>
          ))}
          {filtered.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No players match your search.
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

// Tactical Board: pitch + bench + available players (drag & drop)
function TacticalBoard({
  formation,
  fieldAssignments,
  benchIds,
  rosterById,
  availablePool,
  highlightedSlotId,
  onDropOnSlot,
  onDropToBench,
  onFormationChange,
  onClearBoard,
}: {
  formation: FormationOption
  fieldAssignments: Record<string, string>
  benchIds: string[]
  rosterById: Map<string, any>
  availablePool: any[]
  highlightedSlotId?: string | null
  onDropOnSlot: (e: React.DragEvent, slot: FormationSlot) => void
  onDropToBench: (e: React.DragEvent) => void
  onFormationChange: (id: string) => void
  onClearBoard: () => void
}) {
  const [showBench, setShowBench] = useState(true)

  const benchPlayers = useMemo(
    () =>
      benchIds
        .map((id) => rosterById.get(id))
        .filter((player): player is NonNullable<typeof player> => Boolean(player)),
    [benchIds, rosterById]
  )

  return (
    <Card>
      <CardHeader
        title="2. Build Starting XI"
        subheader="Drag available players onto the pitch, then set your bench"
        action={
          <TextField
            select
            size="small"
            label="Formation"
            value={formation.id}
            onChange={(e) => onFormationChange(e.target.value)}
            sx={{ minWidth: 130 }}
          >
            {FORMATIONS.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.label}
              </MenuItem>
            ))}
          </TextField>
        }
        sx={{ pb: 1 }}
      />
      <CardContent>
        <Stack spacing={2}>
          {/* Pitch */}
          <Box
            sx={{
              position: 'relative',
              height: { xs: 340, md: 420 },
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid #e0e0e0',
              background: 'linear-gradient(180deg, #4aa166 0%, #2f8f55 100%)',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)',
            }}
          >
            {/* Pitch markings (unchanged but with reduced opacity) */}
            <Box sx={{ position: 'absolute', inset: 12, border: '2px solid rgba(255,255,255,0.6)', borderRadius: 2 }} />
            <Box sx={{ position: 'absolute', left: 12, right: 12, top: '50%', height: 2, bgcolor: 'rgba(255,255,255,0.5)', transform: 'translateY(-50%)' }} />
            <Box sx={{ position: 'absolute', left: '50%', top: '50%', width: 80, height: 80, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', transform: 'translate(-50%,-50%)' }} />
            <Box sx={{ position: 'absolute', left: '50%', top: '50%', width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.7)', transform: 'translate(-50%,-50%)' }} />
            <Box sx={{ position: 'absolute', left: '30%', right: '30%', top: 12, height: 50, border: '2px solid rgba(255,255,255,0.5)', borderTop: 'none' }} />
            <Box sx={{ position: 'absolute', left: '30%', right: '30%', bottom: 12, height: 50, border: '2px solid rgba(255,255,255,0.5)', borderBottom: 'none' }} />
            <Box sx={{ position: 'absolute', left: '40%', right: '40%', top: 12, height: 20, border: '2px solid rgba(255,255,255,0.5)', borderTop: 'none' }} />
            <Box sx={{ position: 'absolute', left: '40%', right: '40%', bottom: 12, height: 20, border: '2px solid rgba(255,255,255,0.5)', borderBottom: 'none' }} />

            {/* Formation slots */}
            {formation.slots.map((slot) => {
              const assignedPlayerId = fieldAssignments[slot.id]
              const player = assignedPlayerId ? rosterById.get(assignedPlayerId) : null
              const playerName = player ? getPitchName(player.firstName, player.lastName) : 'Empty'
              const isHighlighted = highlightedSlotId === slot.id

              return (
                <Box
                  key={slot.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDropOnSlot(e, slot)}
                  sx={{
                    position: 'absolute',
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 58,
                    minHeight: 64,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    border: assignedPlayerId
                      ? isHighlighted
                        ? '2px solid #ef4444'
                        : '2px solid rgba(255,255,255,0.9)'
                      : isHighlighted
                        ? '2px solid #ef4444'
                        : '2px dashed rgba(255,255,255,0.4)',
                    bgcolor: assignedPlayerId
                      ? 'rgba(0,0,0,0.6)'
                      : isHighlighted
                        ? 'rgba(239,68,68,0.2)'
                        : 'rgba(255,255,255,0.08)',
                    boxShadow: isHighlighted
                      ? '0 0 0 3px rgba(239,68,68,0.35)'
                      : assignedPlayerId
                        ? '0 0 12px rgba(255,215,0,0.2)'
                        : 'none',
                    transition: 'all 0.2s',
                    px: 0.5,
                    py: 0.5,
                    textAlign: 'center',
                    color: 'common.white',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.5rem', letterSpacing: 0.2 }}>
                    {slot.label}
                  </Typography>
                  <Avatar
                    draggable={Boolean(assignedPlayerId)}
                    onDragStart={(e) => {
                      if (!assignedPlayerId) return
                      e.dataTransfer.setData(
                        'application/diskie-player',
                        serializeDragSource({ kind: 'field', playerId: assignedPlayerId, slotId: slot.id })
                      )
                    }}
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: 10,
                      fontWeight: 800,
                      bgcolor: assignedPlayerId ? 'warning.main' : 'rgba(255,255,255,0.2)',
                      color: assignedPlayerId ? 'common.black' : 'common.white',
                      cursor: assignedPlayerId ? 'grab' : 'default',
                      my: 0.3,
                    }}
                  >
                    {assignedPlayerId ? getJerseyLabel(player?.jerseyNumber).replace('#', '') : slot.group}
                  </Avatar>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.5rem', lineHeight: 1.2 }}>
                    {playerName}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.45rem' }}>
                    {assignedPlayerId ? normalizePosition(player?.position) : slot.group}
                  </Typography>
                </Box>
              )
            })}
          </Box>

          {/* Bench & Available strip */}
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2">Bench</Typography>
              <Chip size="small" label={`${benchIds.length}/${MAX_SUBS}`} />
              <IconButton size="small" onClick={() => setShowBench(!showBench)}>
                {showBench ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>
            <Collapse in={showBench}>
              <Box
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDropToBench}
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  minHeight: 48,
                  border: '1px dashed #ccc',
                  borderRadius: 1,
                  p: 1,
                  mt: 1,
                  bgcolor: 'background.paper',
                }}
              >
                {benchPlayers.map((player) => (
                  <Paper
                    key={player.playerId}
                    variant="outlined"
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData(
                        'application/diskie-player',
                        serializeDragSource({ kind: 'bench', playerId: player.playerId })
                      )
                    }
                    sx={{ p: 0.75, cursor: 'grab', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: 'primary.main' }}>
                      {getJerseyLabel(player.jerseyNumber).replace('#', '')}
                    </Avatar>
                    <Typography variant="caption" noWrap>
                      {getPitchName(player.firstName, player.lastName)}
                    </Typography>
                  </Paper>
                ))}
                {benchPlayers.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Drag players here to bench (max {MAX_SUBS})
                  </Typography>
                )}
              </Box>
            </Collapse>
          </Paper>

          {/* Available players (compact list) */}
          <Box>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2">Available Players</Typography>
              <Chip size="small" label={`${availablePool.length}`} />
            </Stack>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                maxHeight: 100,
                overflowY: 'auto',
                p: 0.5,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                mt: 0.5,
              }}
            >
              {availablePool.map((item) => (
                <Paper
                  key={item.playerId}
                  variant="outlined"
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData(
                      'application/diskie-player',
                      serializeDragSource({ kind: 'available', playerId: item.playerId })
                    )
                  }
                  sx={{
                    p: 0.5,
                    cursor: 'grab',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Avatar sx={{ width: 20, height: 20, fontSize: 8, bgcolor: 'secondary.main' }}>
                    {getJerseyLabel(item.rosterPlayer?.jerseyNumber).replace('#', '')}
                  </Avatar>
                  <Typography variant="caption" noWrap>
                    {item.playerName}
                  </Typography>
                </Paper>
              ))}
              {availablePool.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  All available players are in the squad.
                </Typography>
              )}
            </Box>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="text" color="inherit" onClick={onClearBoard} startIcon={<RestartAltIcon />}>
              Clear Board
            </Button>
            <Button component={RouterLink} to="/coach/schedule" variant="text">
              Back to Schedule
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

// Matchday Panel: status, roles, notes (with stepper, compact)
function MatchdayPanel({
  plannerState,
  validationMessages,
  selectedSquadPlayers,
  onUpdatePlanner,
  onStatusChange,
}: {
  plannerState: MatchdayPlannerState
  validationMessages: string[]
  selectedSquadPlayers: any[]
  onUpdatePlanner: (patch: Partial<MatchdayPlannerState>) => void
  onStatusChange: (status: MatchdayStatus) => void
}) {
  const [showNotes, setShowNotes] = useState(false)
  const statusOptions: MatchdayStatus[] = ['Draft', 'Selection Ready', 'Announced', 'Locked']

  return (
    <Card sx={{ position: { lg: 'sticky' }, top: { lg: 80 } }}>
      <CardHeader title="3. Finalize Matchday" subheader="Set roles, status, and notes" sx={{ pb: 1 }} />
      <CardContent sx={{ pt: 0 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Matchday Status
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
          {statusOptions.map((status) => (
            <Button
              key={status}
              size="small"
              variant={plannerState.status === status ? 'contained' : 'outlined'}
              color={plannerState.status === status ? 'primary' : 'inherit'}
              onClick={() => onStatusChange(status)}
            >
              {status}
            </Button>
          ))}
        </Stack>

        <Alert severity={validationMessages.length === 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
          {validationMessages.length === 0
            ? 'Squad ready'
            : `${validationMessages.length} check${validationMessages.length > 1 ? 's' : ''} pending`}
        </Alert>

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="subtitle2" gutterBottom>
          Leadership Roles
        </Typography>
        <Grid container spacing={1}>
          <Grid size={12}>
            <TextField
              select
              fullWidth
              size="small"
              label="Captain"
              value={plannerState.captainId}
              onChange={(e) => onUpdatePlanner({ captainId: e.target.value })}
            >
              <MenuItem value="">Not assigned</MenuItem>
              {selectedSquadPlayers.map((p) => (
                <MenuItem key={p.playerId} value={p.playerId}>
                  {p.playerName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField
              select
              fullWidth
              size="small"
              label="Vice-Captain"
              value={plannerState.viceCaptainId}
              onChange={(e) => onUpdatePlanner({ viceCaptainId: e.target.value })}
            >
              <MenuItem value="">Not assigned</MenuItem>
              {selectedSquadPlayers.map((p) => (
                <MenuItem key={p.playerId} value={p.playerId}>
                  {p.playerName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField
              select
              fullWidth
              size="small"
              label="Penalty Taker"
              value={plannerState.penaltyTakerId}
              onChange={(e) => onUpdatePlanner({ penaltyTakerId: e.target.value })}
            >
              <MenuItem value="">Not assigned</MenuItem>
              {selectedSquadPlayers.map((p) => (
                <MenuItem key={p.playerId} value={p.playerId}>
                  {p.playerName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <Divider sx={{ my: 1.5 }} />

        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2">Match Notes</Typography>
          <IconButton size="small" onClick={() => setShowNotes(!showNotes)}>
            {showNotes ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>
        <Collapse in={showNotes}>
          <Stack spacing={1} sx={{ mt: 1 }}>
            <TextField
              label="Squad Notes"
              multiline
              minRows={1}
              size="small"
              value={plannerState.squadNotes}
              onChange={(e) => onUpdatePlanner({ squadNotes: e.target.value })}
              placeholder="Late arrivals, fitness, etc."
              fullWidth
            />
            <TextField
              label="In Possession"
              multiline
              minRows={1}
              size="small"
              value={plannerState.inPossessionPlan}
              onChange={(e) => onUpdatePlanner({ inPossessionPlan: e.target.value })}
              placeholder="Tactical plan"
              fullWidth
            />
            <TextField
              label="Out of Possession"
              multiline
              minRows={1}
              size="small"
              value={plannerState.outOfPossessionPlan}
              onChange={(e) => onUpdatePlanner({ outOfPossessionPlan: e.target.value })}
              placeholder="Defensive shape"
              fullWidth
            />
            <TextField
              label="Set-Piece Notes"
              multiline
              minRows={1}
              size="small"
              value={plannerState.setPieceNotes}
              onChange={(e) => onUpdatePlanner({ setPieceNotes: e.target.value })}
              placeholder="Corners, free kicks"
              fullWidth
            />
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  )
}

// ---------- Main Page Component ----------
export function MatchOperationsPage() {
  const { matchId = '' } = useParams<{ matchId: string }>()
  const [searchParams] = useSearchParams()
  const teamId = searchParams.get('teamId') ?? undefined

  const rosterQuery = useCoachRoster(teamId)
  const availabilityQuery = useMatchAvailability(matchId)
  const tacticalQuery = useTacticalLayout(matchId)
  const { requestAvailability, updateAvailability } = useAvailabilityMutations(matchId)
  const saveTacticalLayout = useSaveTacticalLayout()
  const notify = useNotify()

  const [selectedFormationId, setSelectedFormationId] = useState(FORMATIONS[0]?.id ?? DEFAULT_FORMATION.id)
  const [fieldAssignments, setFieldAssignments] = useState<Record<string, string>>({})
  const [benchIds, setBenchIds] = useState<string[]>([])
  const [plannerState, setPlannerState] = useState<MatchdayPlannerState>(createDefaultPlannerState)
  const [highlightedSlotId, setHighlightedSlotId] = useState<string | null>(null)

  const roster = rosterQuery.data ?? []
  const availability = availabilityQuery.data ?? []
  const formation = useMemo(() => getFormationById(selectedFormationId), [selectedFormationId])

  const rosterById = useMemo(
    () =>
      new Map(
        roster.map((player) => [
          player.playerId,
          { ...player, playerName: getPlayerLabel(player.firstName, player.lastName) },
        ])
      ),
    [roster]
  )

  const availabilityById = useMemo(
    () => new Map(availability.map((item) => [item.playerId, item])),
    [availability]
  )

  const fieldPlayerIds = useMemo(
    () => formation.slots.map((slot) => fieldAssignments[slot.id]).filter(Boolean) as string[],
    [fieldAssignments, formation.slots]
  )

  const selectedIds = useMemo(() => new Set([...fieldPlayerIds, ...benchIds]), [benchIds, fieldPlayerIds])

  const selectedGoalkeeperCount = useMemo(
    () => [...selectedIds].filter((id) => isGoalkeeper(rosterById.get(id)?.position)).length,
    [rosterById, selectedIds]
  )

  const selectedSquadCount = fieldPlayerIds.length + benchIds.length

  const selectedSquadPlayers = useMemo(
    () =>
      [...fieldPlayerIds, ...benchIds]
        .map((id) => rosterById.get(id))
        .filter((player): player is NonNullable<typeof player> => Boolean(player)),
    [benchIds, fieldPlayerIds, rosterById]
  )

  const startingPlayers = useMemo(
    () =>
      fieldPlayerIds
        .map((id) => rosterById.get(id))
        .filter((player): player is NonNullable<typeof player> => Boolean(player)),
    [fieldPlayerIds, rosterById]
  )

  const availablePool = useMemo(
    () =>
      availability
        .filter((item) => item.status === 'Available' && !selectedIds.has(item.playerId))
        .map((item) => ({
          ...item,
          rosterPlayer: rosterById.get(item.playerId),
        })),
    [availability, rosterById, selectedIds]
  )

  const placements = useMemo(
    () => buildPlacements(formation, fieldAssignments),
    [fieldAssignments, formation]
  )

  // Validation messages (unchanged logic)
  const validationMessages = useMemo(() => {
    const messages: string[] = []
    if (fieldPlayerIds.length !== MAX_STARTERS) {
      messages.push(`Full starting XI (${fieldPlayerIds.length}/${MAX_STARTERS}).`)
    }
    if (!fieldPlayerIds.some((id) => isGoalkeeper(rosterById.get(id)?.position))) {
      messages.push('Include exactly one goalkeeper in the XI.')
    }
    if (benchIds.length > MAX_SUBS) {
      messages.push(`Only ${MAX_SUBS} substitutes on bench.`)
    }
    if (selectedSquadCount > MAX_MATCHDAY_SQUAD) {
      messages.push(`Only ${MAX_MATCHDAY_SQUAD} players in squad.`)
    }
    if (selectedGoalkeeperCount > MAX_GOALKEEPERS) {
      messages.push(`Only ${MAX_GOALKEEPERS} goalkeepers in squad.`)
    }
    const injured = selectedSquadPlayers.filter((p) => p.hasActiveInjury)
    if (injured.length) {
      messages.push(`Injured: ${injured.map((p) => p.playerName).join(', ')}.`)
    }
    const unavailableStarters = startingPlayers.filter(
      (p) => availabilityById.get(p.playerId)?.status !== 'Available'
    )
    if (unavailableStarters.length) {
      messages.push(`Unavailable starters: ${unavailableStarters.map((p) => p.playerName).join(', ')}.`)
    }
    if (!plannerState.captainId) {
      messages.push('Assign a captain.')
    }
    if (plannerState.captainId && plannerState.viceCaptainId && plannerState.captainId === plannerState.viceCaptainId) {
      messages.push('Captain and vice-captain must be different.')
    }
    return messages
  }, [
    fieldPlayerIds,
    benchIds,
    selectedSquadCount,
    selectedGoalkeeperCount,
    selectedSquadPlayers,
    startingPlayers,
    rosterById,
    availabilityById,
    plannerState.captainId,
    plannerState.viceCaptainId,
  ])

  // Load saved layout
  useEffect(() => {
    if (!tacticalQuery.data || roster.length === 0) return
    const persistedFormationId = tacticalQuery.data.formationId
    const hydratedFormation =
      persistedFormationId && FORMATIONS.some((f) => f.id === persistedFormationId)
        ? getFormationById(persistedFormationId)
        : formation

    if (persistedFormationId && FORMATIONS.some((f) => f.id === persistedFormationId)) {
      setSelectedFormationId(persistedFormationId)
    }

    setPlannerState({
      status: (tacticalQuery.data.planner?.status as MatchdayStatus) || 'Draft',
      captainId: tacticalQuery.data.planner?.captainId || '',
      viceCaptainId: tacticalQuery.data.planner?.viceCaptainId || '',
      penaltyTakerId: tacticalQuery.data.planner?.penaltyTakerId || '',
      squadNotes: tacticalQuery.data.planner?.squadNotes || '',
      inPossessionPlan: tacticalQuery.data.planner?.inPossessionPlan || '',
      outOfPossessionPlan: tacticalQuery.data.planner?.outOfPossessionPlan || '',
      setPieceNotes: tacticalQuery.data.planner?.setPieceNotes || '',
    })
    setBenchIds(tacticalQuery.data.benchPlayerIds || [])
    setFieldAssignments(buildAssignmentsFromSaved(tacticalQuery.data.players, hydratedFormation, rosterById))
  }, [formation, roster.length, rosterById, tacticalQuery.data])

  // Handlers (most remain the same, but we use useCallback)
  const handleToggleAvailability = useCallback(
    (playerId: string, checked: boolean) => {
      updateAvailability.mutate([{ playerId, status: checked ? 'Available' : 'Unavailable' }])
    },
    [updateAvailability]
  )

  const handleRequestAvailability = useCallback(() => {
    requestAvailability.mutate(roster.map((p) => p.playerId))
  }, [requestAvailability, roster])

  const moveToBench = useCallback((playerId: string) => {
    setBenchIds((curr) => (curr.includes(playerId) ? curr : [...curr, playerId]))
  }, [])

  const removeFromBench = useCallback((playerId: string) => {
    setBenchIds((curr) => curr.filter((id) => id !== playerId))
  }, [])

  const clearPlayerFromField = useCallback((playerId: string) => {
    setFieldAssignments((curr) => {
      const next = { ...curr }
      for (const [slotId, assigned] of Object.entries(next)) {
        if (assigned === playerId) delete next[slotId]
      }
      return next
    })
  }, [])

  const canAddPlayerToSquad = useCallback(
    (playerId: string): boolean => {
      if (selectedIds.has(playerId)) return true
      if (selectedSquadCount >= MAX_MATCHDAY_SQUAD) {
        notify(`Only ${MAX_MATCHDAY_SQUAD} players allowed.`, 'warning')
        return false
      }
      if (isGoalkeeper(rosterById.get(playerId)?.position) && selectedGoalkeeperCount >= MAX_GOALKEEPERS) {
        notify(`Only ${MAX_GOALKEEPERS} goalkeepers allowed.`, 'warning')
        return false
      }
      return true
    },
    [selectedIds, selectedSquadCount, selectedGoalkeeperCount, rosterById, notify]
  )

  const handleDropToBench = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const source = parseDragSource(event.dataTransfer.getData('application/diskie-player'))
      if (!source || source.kind === 'bench') return
      if (benchIds.length >= MAX_SUBS) {
        notify(`Only ${MAX_SUBS} substitutes on bench.`, 'warning')
        return
      }
      if (!canAddPlayerToSquad(source.playerId)) return
      if (source.kind === 'field') {
        clearPlayerFromField(source.playerId)
        moveToBench(source.playerId)
        return
      }
      moveToBench(source.playerId)
    },
    [benchIds.length, canAddPlayerToSquad, clearPlayerFromField, moveToBench, notify]
  )

  const handleFormationChange = useCallback(
    (formationId: string) => {
      const nextFormation = getFormationById(formationId)
      const orderedFieldPlayers = formation.slots
        .map((slot) => fieldAssignments[slot.id])
        .filter(Boolean) as string[]
      setSelectedFormationId(formationId)
      setFieldAssignments(assignPlayersToFormation(orderedFieldPlayers, nextFormation, rosterById))
    },
    [formation, fieldAssignments, rosterById]
  )

  const updatePlannerState = useCallback((patch: Partial<MatchdayPlannerState>) => {
    setPlannerState((prev) => ({ ...prev, ...patch }))
  }, [])

  const handleStatusChange = useCallback(
    (nextStatus: MatchdayStatus) => {
      if (nextStatus !== 'Draft' && validationMessages.length > 0) {
        notify('Resolve checks before moving status.', 'warning')
        return
      }
      updatePlannerState({ status: nextStatus })
      notify(`Status updated to ${nextStatus}.`, 'success')
    },
    [validationMessages, updatePlannerState, notify]
  )

  const handleDropOnSlot = useCallback(
    (event: React.DragEvent, slot: FormationSlot) => {
      event.preventDefault()
      setHighlightedSlotId(null)
      const source = parseDragSource(event.dataTransfer.getData('application/diskie-player'))
      if (!source) return
      const incomingPlayer = rosterById.get(source.playerId)
      if (!incomingPlayer) return

      if (slot.group === 'GK' && !isGoalkeeper(incomingPlayer.position)) {
        notify('Only GK can be placed in GK slot.', 'warning')
        return
      }
      if (slot.group !== 'GK' && isGoalkeeper(incomingPlayer.position)) {
        notify('Goalkeeper can only be placed in GK slot.', 'warning')
        return
      }

      const currentOccupantId = fieldAssignments[slot.id]
      if (source.kind === 'field' && source.slotId === slot.id) return

      if (source.kind !== 'field' && fieldPlayerIds.length >= MAX_STARTERS && !currentOccupantId) {
        notify(`Only ${MAX_STARTERS} players on field.`, 'warning')
        return
      }

      if (!canAddPlayerToSquad(source.playerId)) return

      // Handle substitution
      if (currentOccupantId && currentOccupantId !== source.playerId) {
        const outgoingPlayer = rosterById.get(currentOccupantId)
        if (
          outgoingPlayer &&
          isGoalkeeper(outgoingPlayer.position) !== isGoalkeeper(incomingPlayer.position)
        ) {
          notify('Goalkeeper can only be substituted by another GK.', 'warning')
          return
        }

        if (source.kind === 'available') {
          if (benchIds.length >= MAX_SUBS) {
            notify(`Only ${MAX_SUBS} substitutes on bench.`, 'warning')
            return
          }
          moveToBench(currentOccupantId)
        }

        if (source.kind === 'bench') {
          setBenchIds((curr) =>
            curr.map((id) => (id === source.playerId ? currentOccupantId : id))
          )
        }

        if (source.kind === 'field') {
          setFieldAssignments((curr) => {
            const next = { ...curr }
            next[source.slotId] = currentOccupantId
            next[slot.id] = source.playerId
            return next
          })
          return
        }
      }

      // Place player
      if (source.kind === 'bench') removeFromBench(source.playerId)
      if (source.kind === 'field') clearPlayerFromField(source.playerId)

      setFieldAssignments((curr) => ({ ...curr, [slot.id]: source.playerId }))
    },
    [
      rosterById,
      fieldAssignments,
      fieldPlayerIds.length,
      benchIds.length,
      canAddPlayerToSquad,
      moveToBench,
      removeFromBench,
      clearPlayerFromField,
      notify,
    ]
  )

  const saveLayout = useCallback(async () => {
    try {
      setHighlightedSlotId(null)
      await saveTacticalLayout.mutateAsync({
        matchId,
        formationId: selectedFormationId,
        benchPlayerIds: benchIds,
        planner: {
          status: plannerState.status,
          captainId: plannerState.captainId || null,
          viceCaptainId: plannerState.viceCaptainId || null,
          penaltyTakerId: plannerState.penaltyTakerId || null,
          squadNotes: plannerState.squadNotes || null,
          inPossessionPlan: plannerState.inPossessionPlan || null,
          outOfPossessionPlan: plannerState.outOfPossessionPlan || null,
          setPieceNotes: plannerState.setPieceNotes || null,
        },
        players: placements,
      })
      notify('Tactical layout saved.', 'success')
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not save layout.')
      const lowerMessage = message.toLowerCase()

      // Try to map backend player-specific errors to an on-pitch slot highlight.
      const assignedEntry = Object.entries(fieldAssignments).find(([, playerId]) => {
        const player = rosterById.get(playerId)
        if (!player) return false
        const fullName = `${player.firstName ?? ''} ${player.lastName ?? ''}`.trim().toLowerCase()
        return fullName.length > 0 && lowerMessage.includes(fullName)
      })

      if (assignedEntry) {
        setHighlightedSlotId(assignedEntry[0])
      }

      notify(`Lineup validation: ${message}`, 'error')
    }
  }, [saveTacticalLayout, matchId, selectedFormationId, benchIds, plannerState, placements, notify, fieldAssignments, rosterById])

  const resetLayout = useCallback(() => {
    setFieldAssignments({})
    setBenchIds([])
    setPlannerState(createDefaultPlannerState())
    setHighlightedSlotId(null)
  }, [])

  // Loading/Error states
  if (rosterQuery.isLoading || availabilityQuery.isLoading || tacticalQuery.isLoading) {
    return <LoadingState label="Loading match operations…" />
  }
  if (rosterQuery.isError) {
    return <ErrorState message={extractErrorMessage(rosterQuery.error)} onRetry={rosterQuery.refetch} />
  }
  if (availabilityQuery.isError) {
    return <ErrorState message={extractErrorMessage(availabilityQuery.error)} onRetry={availabilityQuery.refetch} />
  }
  if (tacticalQuery.isError) {
    return <ErrorState message={extractErrorMessage(tacticalQuery.error)} onRetry={tacticalQuery.refetch} />
  }
  if (!teamId) {
    return (
      <>
        <PageHeader title="Match Operations" description="Missing team context." />
        <Alert severity="warning">Please open from schedule screen.</Alert>
      </>
    )
  }

  // Main render
  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', width: '100%', px: 2 }}>
      <PageHeader
        title="Matchday Operations"
        description="Simple, clean workflow: check availability, set your XI, and finalize matchday details."
        action={
          <Stack direction="row" spacing={1}>
            <Button startIcon={<CallIcon />} variant="outlined" onClick={handleRequestAvailability}>
              Request Availability
            </Button>
            <Button startIcon={<SaveIcon />} variant="contained" onClick={saveLayout}>
              Save Layout
            </Button>
          </Stack>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, md: 2 }}>
              <Chip size="small" color="primary" label={`Formation ${formation.label}`} />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Chip
                size="small"
                color={
                  plannerState.status === 'Locked'
                    ? 'success'
                    : plannerState.status === 'Announced'
                      ? 'primary'
                      : plannerState.status === 'Selection Ready'
                        ? 'warning'
                        : 'default'
                }
                label={`Status ${plannerState.status}`}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Chip size="small" color={fieldPlayerIds.length === MAX_STARTERS ? 'success' : 'warning'} label={`XI ${fieldPlayerIds.length}/${MAX_STARTERS}`} />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Chip size="small" color={benchIds.length === MAX_SUBS ? 'success' : 'default'} label={`Bench ${benchIds.length}/${MAX_SUBS}`} />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Chip size="small" color={selectedSquadCount === MAX_MATCHDAY_SQUAD ? 'success' : 'default'} label={`Squad ${selectedSquadCount}/${MAX_MATCHDAY_SQUAD}`} />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Chip size="small" color={selectedGoalkeeperCount <= MAX_GOALKEEPERS ? 'default' : 'error'} label={`GKs ${selectedGoalkeeperCount}/${MAX_GOALKEEPERS}`} />
            </Grid>
          </Grid>
          <Alert severity={validationMessages.length === 0 ? 'success' : 'warning'} sx={{ mt: 2 }}>
            {validationMessages.length === 0
              ? 'All required checks are complete. You can safely announce and lock this matchday squad.'
              : `You still have ${validationMessages.length} check${validationMessages.length > 1 ? 's' : ''} to complete before finalizing.`}
          </Alert>
        </CardContent>
      </Card>

      {/* Three-column grid */}
      <Grid container spacing={3}>
        {/* Left: Squad Selector */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <SquadSelector
            availability={availability}
            selectedIds={selectedIds}
            onToggleAvailability={handleToggleAvailability}
            onRequestAvailability={handleRequestAvailability}
          />
        </Grid>

        {/* Center: Tactical Board */}
        <Grid size={{ xs: 12, md: 8, lg: 6 }}>
          <TacticalBoard
            formation={formation}
            fieldAssignments={fieldAssignments}
            benchIds={benchIds}
            rosterById={rosterById}
            availablePool={availablePool}
            highlightedSlotId={highlightedSlotId}
            onDropOnSlot={handleDropOnSlot}
            onDropToBench={handleDropToBench}
            onFormationChange={handleFormationChange}
            onClearBoard={resetLayout}
          />
        </Grid>

        {/* Right: Matchday Panel (sticky) */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <MatchdayPanel
            plannerState={plannerState}
            validationMessages={validationMessages}
            selectedSquadPlayers={selectedSquadPlayers}
            onUpdatePlanner={updatePlannerState}
            onStatusChange={handleStatusChange}
          />
        </Grid>
      </Grid>
    </Box>
  )
}