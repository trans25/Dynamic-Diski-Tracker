import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  ListItem,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard'
import GroupsIcon from '@mui/icons-material/Groups'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import HealingIcon from '@mui/icons-material/Healing'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import MenuIcon from '@mui/icons-material/Menu'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import AddIcon from '@mui/icons-material/Add'
import NotificationsIcon from '@mui/icons-material/Notifications'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonIcon from '@mui/icons-material/Person'
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import { Logo } from '../Logo'
import { GlobalSearch } from '../GlobalSearch'
import { useAuth } from '../../auth/AuthContext'
import { useAlerts, useCoachRoster, useCoachTeams, useMarkAlertRead, useUpcomingFixtures } from '../../hooks/useCoach'
import { coachService } from '../../api/services/coachService'
import type { ChemistryPairViewModel, PlayerGrowthPointViewModel, SquadFatigueItemViewModel } from '../../api/types'

const COACH_SIDEBAR_WIDTH = 284

type AssistantMessage = {
  id: string
  role: 'coach' | 'assist'
  text: string
  action?: {
    label: string
    to: string
  }
}

type CoachNavItem = {
  title: string
  to: string
  icon: typeof SpaceDashboardIcon
}

const coachPrimaryNav: CoachNavItem[] = [
  { title: 'Dashboard', to: '/coach', icon: SpaceDashboardIcon },
  { title: 'Squad', to: '/coach/teams', icon: GroupsIcon },
  { title: 'Match Center', to: '/coach/schedule', icon: SportsSoccerIcon },
  { title: 'Training', to: '/coach/schedule', icon: FitnessCenterIcon },
  { title: 'Injury Room', to: '/coach/injuries', icon: HealingIcon },
]

const coachAdminNav: CoachNavItem[] = [
  { title: 'Club Admin', to: '/coach/profile', icon: AdminPanelSettingsIcon },
]

function formatCountdown(targetDate: string): string {
  const now = Date.now()
  const target = new Date(targetDate).getTime()
  const diffMs = Math.max(0, target - now)
  const totalMins = Math.floor(diffMs / 60000)
  const days = Math.floor(totalMins / (60 * 24))
  const hours = Math.floor((totalMins % (60 * 24)) / 60)
  const mins = totalMins % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function normalizePositionGroup(position?: string | null): 'GK' | 'DEF' | 'MID' | 'FWD' | 'OTHER' {
  const value = (position ?? '').trim().toUpperCase()
  if (value === 'GK' || value.includes('GOALKEEPER')) return 'GK'
  if (['LB', 'LCB', 'CB', 'RCB', 'RB', 'LWB', 'RWB', 'DEF'].some((token) => value.includes(token))) return 'DEF'
  if (['CDM', 'CM', 'CAM', 'LM', 'RM', 'LAM', 'RAM', 'MID'].some((token) => value.includes(token))) return 'MID'
  if (['ST', 'CF', 'FW', 'LW', 'RW', 'FWD'].some((token) => value.includes(token))) return 'FWD'
  return 'OTHER'
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function CoachSidebar({
  onNavigate,
  todayMatchLabel,
}: {
  onNavigate?: () => void
  todayMatchLabel: string
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0c1733', color: '#ebf1ff' }}>
      <Toolbar sx={{ px: 2.25, minHeight: '72px !important' }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: '#1f3e8a',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Logo size={20} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              Diski Tracker Hub
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(235,241,255,0.72)' }}>
              Pitch-Side Console
            </Typography>
          </Box>
        </Stack>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(235,241,255,0.16)' }} />

      <List
        dense
        disablePadding
        subheader={<ListSubheader sx={{ bgcolor: 'transparent', color: 'rgba(235,241,255,0.56)' }}>OPERATIONS</ListSubheader>}
        sx={{ px: 1.25, pt: 1 }}
      >
        {coachPrimaryNav.map((item) => {
          const Icon = item.icon
          return (
            <ListItemButton
              key={item.title}
              component={NavLink}
              to={item.to}
              end={item.to === '/coach'}
              onClick={onNavigate}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: 'rgba(235,241,255,0.86)',
                '& .MuiListItemIcon-root': { color: 'rgba(235,241,255,0.72)' },
                '&.active': {
                  bgcolor: 'rgba(66, 133, 244, 0.18)',
                  color: '#ffffff',
                  position: 'relative',
                },
                '&.active::before': {
                  content: '""',
                  position: 'absolute',
                  left: -4,
                  top: 7,
                  bottom: 7,
                  width: 4,
                  borderRadius: 99,
                  bgcolor: '#3bc77c',
                },
                '&.active .MuiListItemIcon-root': { color: '#ffffff' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                slotProps={{ primary: { variant: 'body2', sx: { fontWeight: 600 } } }}
              />
            </ListItemButton>
          )
        })}
      </List>

      <List
        dense
        disablePadding
        subheader={<ListSubheader sx={{ bgcolor: 'transparent', color: 'rgba(235,241,255,0.56)' }}>ADMIN</ListSubheader>}
        sx={{ px: 1.25, pt: 1 }}
      >
        {coachAdminNav.map((item) => {
          const Icon = item.icon
          return (
            <ListItemButton
              key={item.title}
              component={NavLink}
              to={item.to}
              onClick={onNavigate}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: 'rgba(235,241,255,0.86)',
                '& .MuiListItemIcon-root': { color: 'rgba(235,241,255,0.72)' },
                '&.active': {
                  bgcolor: 'rgba(66, 133, 244, 0.18)',
                  color: '#ffffff',
                  position: 'relative',
                },
                '&.active::before': {
                  content: '""',
                  position: 'absolute',
                  left: -4,
                  top: 7,
                  bottom: 7,
                  width: 4,
                  borderRadius: 99,
                  bgcolor: '#3bc77c',
                },
                '&.active .MuiListItemIcon-root': { color: '#ffffff' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                slotProps={{ primary: { variant: 'body2', sx: { fontWeight: 600 } } }}
              />
            </ListItemButton>
          )
        })}
      </List>

      <Box sx={{ flex: 1 }} />
      <Box sx={{ p: 1.5 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            p: 1.25,
            bgcolor: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(235,241,255,0.2)',
          }}
        >
          <Typography variant="caption" sx={{ color: 'rgba(235,241,255,0.72)', display: 'block' }}>
            TODAY'S MATCH
          </Typography>
          <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 700 }}>
            {todayMatchLabel}
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}

export function CoachLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountAnchorEl, setAccountAnchorEl] = useState<null | HTMLElement>(null)
  const [alertsAnchorEl, setAlertsAnchorEl] = useState<null | HTMLElement>(null)
  const [quickActionsAnchorEl, setQuickActionsAnchorEl] = useState<null | HTMLElement>(null)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantBusy, setAssistantBusy] = useState(false)
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    {
      id: 'assist-welcome',
      role: 'assist',
      text: 'Coach Assist is ready. Ask for match prep, lineup tips, injuries, or quick actions.',
    },
  ])

  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const teamsQuery = useCoachTeams()
  const upcomingQuery = useUpcomingFixtures()
  const alertsQuery = useAlerts()
  const markAlertRead = useMarkAlertRead()

  const activeTeamId = teamsQuery.data?.[0]?.id
  const rosterQuery = useCoachRoster(activeTeamId)

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()

  const todayMatchLabel = useMemo(() => {
    const nextMatch = (upcomingQuery.data ?? [])
      .filter((fixture) => !fixture.isCancelled)
      .sort((a, b) => new Date(a.fixtureDate).getTime() - new Date(b.fixtureDate).getTime())[0]

    if (!nextMatch) return 'No fixture scheduled'

    const opponent = nextMatch.opponent || (nextMatch.isTraining ? 'Training Session' : 'Upcoming Fixture')
    const countdown = formatCountdown(nextMatch.fixtureDate)
    return `${opponent} in ${countdown}`
  }, [upcomingQuery.data])

  const pageTitle = useMemo(() => {
    const activeItem = [...coachPrimaryNav, ...coachAdminNav]
      .filter((item) =>
        item.to === '/coach' ? location.pathname === '/coach' : location.pathname.startsWith(item.to),
      )
      .sort((a, b) => b.to.length - a.to.length)[0]

    return activeItem?.title ?? 'Coach Portal'
  }, [location.pathname])

  const openAccountMenu = (event: MouseEvent<HTMLElement>) => setAccountAnchorEl(event.currentTarget)
  const closeAccountMenu = () => setAccountAnchorEl(null)
  const openAlertsMenu = (event: MouseEvent<HTMLElement>) => setAlertsAnchorEl(event.currentTarget)
  const closeAlertsMenu = () => setAlertsAnchorEl(null)
  const openQuickActionsMenu = (event: MouseEvent<HTMLElement>) => setQuickActionsAnchorEl(event.currentTarget)
  const closeQuickActionsMenu = () => setQuickActionsAnchorEl(null)

  const handleLogout = () => {
    closeAccountMenu()
    logout()
    navigate('/sign-in', { replace: true })
  }

  const buildAssistantReply = async (query: string): Promise<Omit<AssistantMessage, 'id' | 'role'>> => {
    const lower = query.toLowerCase()
    const unreadAlerts = alertsQuery.data?.unreadCount ?? 0

    if (lower.includes('unavailable') || lower.includes('injury') || lower.includes('risk')) {
      const alertSummary = unreadAlerts > 0
        ? `There are ${unreadAlerts} unread alert(s) that may affect selection.`
        : 'No unread alerts right now.'
      return {
        text: `${alertSummary} Open Injury Room to review active injuries and expected returns before finalizing your XI.`,
        action: { label: 'Open Injury Room', to: '/coach/injuries' },
      }
    }

    const asksForDataDrivenLineup =
      lower.includes('lineup') ||
      lower.includes('4-3-3') ||
      lower.includes('formation') ||
      lower.includes('recommended xi') ||
      lower.includes('winning') ||
      lower.includes('wining') ||
      lower.includes('which player')

    if (asksForDataDrivenLineup) {
      const roster = rosterQuery.data ?? []
      if (roster.length === 0) {
        return {
          text: 'I do not have squad data loaded yet. Open Squad first, then ask again for a data-based XI.',
          action: { label: 'Open Squad', to: '/coach/teams' },
        }
      }

      const [fatigueRows, chemistryPairs, growthByPlayer] = await Promise.all([
        coachService.getSquadFatigue().catch(() => [] as SquadFatigueItemViewModel[]),
        coachService.getChemistryPairs(12).catch(() => [] as ChemistryPairViewModel[]),
        Promise.all(
          roster.map(async (player) => {
            const points = await coachService.getPlayerGrowth(player.playerId).catch(() => [] as PlayerGrowthPointViewModel[])
            return { playerId: player.playerId, points }
          }),
        ),
      ])

      const fatigueByPlayerId = new Map(fatigueRows.map((row) => [row.playerId, row]))
      const growthMap = new Map(growthByPlayer.map((entry) => [entry.playerId, entry.points]))

      const chemistryPotential = new Map<string, number>()
      chemistryPairs.forEach((pair) => {
        const pairScore = pair.winPercentage * 0.45 + pair.combinedGoalContributionsPerGame * 22
        chemistryPotential.set(pair.playerAId, (chemistryPotential.get(pair.playerAId) ?? 0) + pairScore)
        chemistryPotential.set(pair.playerBId, (chemistryPotential.get(pair.playerBId) ?? 0) + pairScore)
      })

      const playersWithScore = roster.map((player) => {
        const growth = (growthMap.get(player.playerId) ?? []).slice(-6)
        const avgRatingRaw =
          growth.length > 0 ? growth.reduce((sum, point) => sum + point.rating, 0) / growth.length : 0
        const avgRating = avgRatingRaw <= 10 ? avgRatingRaw * 10 : avgRatingRaw
        const recentGoals = growth.reduce((sum, point) => sum + point.goals, 0)
        const recentAssists = growth.reduce((sum, point) => sum + point.assists, 0)

        const fatigue = fatigueByPlayerId.get(player.playerId)
        const fatiguePenalty =
          fatigue?.status === 'Exhausted' ? 26 : fatigue?.status === 'Tired' ? 12 : 0

        const availabilityPenalty = player.hasActiveInjury ? 35 : player.isActive ? 0 : 16

        const chemistryBoost = (chemistryPotential.get(player.playerId) ?? 0) / 10
        const contributionBoost = recentGoals * 5 + recentAssists * 3.5

        const score = clamp(35 + avgRating * 0.42 + contributionBoost + chemistryBoost - fatiguePenalty - availabilityPenalty, 0, 100)

        return {
          ...player,
          name: `${player.firstName} ${player.lastName}`.trim(),
          group: normalizePositionGroup(player.position),
          score,
          avgRating,
          recentGoals,
          recentAssists,
          fatigueStatus: fatigue?.status ?? 'Fit',
          unavailable: player.hasActiveInjury || !player.isActive,
        }
      })

      const eligible = playersWithScore.filter((player) => !player.unavailable)

      const pickTop = (group: 'GK' | 'DEF' | 'MID' | 'FWD', count: number) =>
        eligible
          .filter((player) => player.group === group)
          .sort((a, b) => b.score - a.score)
          .slice(0, count)

      const selected = [
        ...pickTop('GK', 1),
        ...pickTop('DEF', 4),
        ...pickTop('MID', 3),
        ...pickTop('FWD', 3),
      ]

      if (selected.length < 11) {
        const selectedIds = new Set(selected.map((player) => player.playerId))
        const extras = eligible
          .filter((player) => !selectedIds.has(player.playerId))
          .sort((a, b) => b.score - a.score)
          .slice(0, 11 - selected.length)
        selected.push(...extras)
      }

      const avgXiScore = selected.reduce((sum, player) => sum + player.score, 0) / Math.max(selected.length, 1)
      const chemistryXiBoost =
        chemistryPairs
          .filter((pair) => selected.some((p) => p.playerId === pair.playerAId) && selected.some((p) => p.playerId === pair.playerBId))
          .reduce((sum, pair) => sum + pair.winPercentage, 0) /
        Math.max(selected.length, 1)

      const predictedWinChance = clamp(Math.round(32 + avgXiScore * 0.52 + chemistryXiBoost * 0.18), 25, 86)

      const impactPlayer = [...eligible].sort((a, b) => b.score - a.score)[0]
      const impactLift = impactPlayer ? clamp(Math.round((impactPlayer.score - avgXiScore) * 0.45), 2, 18) : 0

      const xiByLine = [
        `GK: ${selected.filter((p) => p.group === 'GK').map((p) => p.name).join(', ') || 'TBD'}`,
        `DEF: ${selected.filter((p) => p.group === 'DEF').map((p) => p.name).join(', ') || 'TBD'}`,
        `MID: ${selected.filter((p) => p.group === 'MID').map((p) => p.name).join(', ') || 'TBD'}`,
        `FWD: ${selected.filter((p) => p.group === 'FWD').map((p) => p.name).join(', ') || 'TBD'}`,
      ].join('\n')

      if (lower.includes('which player') || lower.includes('winning') || lower.includes('wining')) {
        if (!impactPlayer) {
          return {
            text: 'I cannot compute impact right now because no eligible match-fit players were found.',
            action: { label: 'Open Injury Room', to: '/coach/injuries' },
          }
        }

        return {
          text:
            `Best win-impact player right now: ${impactPlayer.name}.\n` +
            `Estimated win-lift if started: +${impactLift}%.\n` +
            `Current modelled win chance with recommended XI: ${predictedWinChance}%.\n` +
            `Why: form ${Math.round(impactPlayer.avgRating)}%, recent output ${impactPlayer.recentGoals}G/${impactPlayer.recentAssists}A, fatigue ${impactPlayer.fatigueStatus}.`,
          action: { label: 'Open Match Ops', to: '/coach/schedule' },
        }
      }

      return {
        text:
          `Recommended XI (data-driven 4-3-3):\n${xiByLine}\n\n` +
          `Predicted win chance: ${predictedWinChance}%\n` +
          `Top impact player: ${impactPlayer?.name ?? 'N/A'} (+${impactLift}% lift)\n` +
          `Model uses recent form, goal/assist output, fatigue status, chemistry combinations, and injury availability.`,
        action: { label: 'Set Lineup Now', to: '/coach/schedule' },
      }
    }

    if (lower.includes('next match') || lower.includes('countdown') || lower.includes('kickoff')) {
      return {
        text: `Next match status: ${todayMatchLabel}. Use Match Center to confirm event details and open lineup builder.`,
        action: { label: 'Go To Match Center', to: '/coach/schedule' },
      }
    }

    if (lower.includes('add player') || lower.includes('new player')) {
      return {
        text: 'You can add a player from Squad Management using the Add Player action.',
        action: { label: 'Open Squad', to: '/coach/teams?quick=add-player' },
      }
    }

    if (lower.includes('new match') || lower.includes('schedule')) {
      return {
        text: 'You can create a new match from Match Center.',
        action: { label: 'Create Match', to: '/coach/schedule?quick=new-match' },
      }
    }

    return {
      text: 'I can help with lineup planning, match readiness, injury checks, or quick navigation. Try asking about unavailable players, the next match, or 4-3-3 setup.',
    }
  }

  const handleAssistantSend = () => {
    const prompt = assistantInput.trim()
    if (!prompt) return

    const userMessage: AssistantMessage = {
      id: `coach-${Date.now()}`,
      role: 'coach',
      text: prompt,
    }
    setAssistantMessages((prev) => [...prev, userMessage])
    setAssistantInput('')

    setAssistantBusy(true)
    void buildAssistantReply(prompt)
      .then((reply) => {
        const assistMessage: AssistantMessage = {
          id: `assist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role: 'assist',
          text: reply.text,
          action: reply.action,
        }
        setAssistantMessages((prev) => [...prev, assistMessage])
      })
      .catch(() => {
        setAssistantMessages((prev) => [
          ...prev,
          {
            id: `assist-error-${Date.now()}`,
            role: 'assist',
            text: 'I could not complete the analysis right now. Please try again in a few seconds.',
          },
        ])
      })
      .finally(() => {
        setAssistantBusy(false)
      })
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100svh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${COACH_SIDEBAR_WIDTH}px)` },
          ml: { md: `${COACH_SIDEBAR_WIDTH}px` },
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar sx={{ gap: 1.25, minHeight: '72px !important' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Stack spacing={0} sx={{ minWidth: 170 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              {pageTitle}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Diski Tracker Hub
            </Typography>
          </Stack>

          <Box sx={{ flexGrow: 1, maxWidth: 460, display: { xs: 'none', md: 'block' } }}>
            <GlobalSearch placeholder="Search players, matches, or staff" />
          </Box>

          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={openQuickActionsMenu}
            data-quick-action-trigger
          >
            Quick Action
          </Button>

          <Tooltip title="Coach Assist">
            <IconButton color="inherit" onClick={() => setAssistantOpen(true)}>
              <AutoAwesomeIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Alerts">
            <IconButton color="inherit" onClick={openAlertsMenu}>
              <Badge color="error" badgeContent={alertsQuery.data?.unreadCount ?? 0}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Account">
            <IconButton onClick={openAccountMenu}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
                {initials || <PersonIcon fontSize="small" />}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: COACH_SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: COACH_SIDEBAR_WIDTH,
              borderRight: 0,
            },
          }}
        >
          <CoachSidebar onNavigate={() => setMobileOpen(false)} todayMatchLabel={todayMatchLabel} />
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: COACH_SIDEBAR_WIDTH,
              borderRight: 0,
            },
          }}
        >
          <CoachSidebar todayMatchLabel={todayMatchLabel} />
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${COACH_SIDEBAR_WIDTH}px)` },
          minHeight: '100svh',
        }}
      >
        <Toolbar sx={{ minHeight: '72px !important' }} />
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>

      <Menu
        anchorEl={quickActionsAnchorEl}
        open={Boolean(quickActionsAnchorEl)}
        onClose={closeQuickActionsMenu}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        <MenuItem
          onClick={() => {
            closeQuickActionsMenu()
            navigate('/coach/schedule?quick=new-match')
          }}
        >
          + New Match
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeQuickActionsMenu()
            navigate('/coach/teams?quick=add-player')
          }}
        >
          + Add Player
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={alertsAnchorEl}
        open={Boolean(alertsAnchorEl)}
        onClose={closeAlertsMenu}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 320 }}>
          <Typography variant="subtitle2">Smart Alerts</Typography>
          <Typography variant="caption" color="text.secondary">
            Unread: {alertsQuery.data?.unreadCount ?? 0}
          </Typography>
        </Box>
        <Divider />
        {(alertsQuery.data?.items ?? []).slice(0, 6).map((alert) => (
          <MenuItem
            key={alert.id}
            onClick={() => {
              if (!alert.isRead) {
                markAlertRead.mutate(alert.id)
              }
              closeAlertsMenu()
            }}
            sx={{ whiteSpace: 'normal', alignItems: 'flex-start' }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: alert.isRead ? 500 : 700 }}>
                {alert.playerName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {alert.message}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        {(alertsQuery.data?.items ?? []).length === 0 ? <MenuItem disabled>No alerts right now.</MenuItem> : null}
      </Menu>

      <Menu
        anchorEl={accountAnchorEl}
        open={Boolean(accountAnchorEl)}
        onClose={closeAccountMenu}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2">{user ? `${user.firstName} ${user.lastName}` : 'Account'}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            closeAccountMenu()
            navigate('/coach/profile')
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>

      <Drawer
        anchor="right"
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 380 },
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <ChatOutlinedIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Coach Assist
                </Typography>
              </Stack>
              <IconButton size="small" onClick={() => setAssistantOpen(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Ask for lineup tips, injury summaries, and next-match reminders.
            </Typography>

            <Stack spacing={1} sx={{ mb: 2 }}>
              {assistantMessages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    alignSelf: message.role === 'coach' ? 'flex-end' : 'flex-start',
                    maxWidth: '90%',
                    borderRadius: 2,
                    px: 1.25,
                    py: 0.9,
                    bgcolor: message.role === 'coach' ? 'primary.main' : 'action.hover',
                    color: message.role === 'coach' ? 'primary.contrastText' : 'text.primary',
                  }}
                >
                  <Typography variant="body2">{message.text}</Typography>
                  {message.action ? (
                    <Button
                      size="small"
                      variant={message.role === 'coach' ? 'outlined' : 'contained'}
                      color={message.role === 'coach' ? 'inherit' : 'primary'}
                      sx={{ mt: 1, borderColor: message.role === 'coach' ? 'rgba(255,255,255,0.6)' : undefined }}
                      onClick={() => {
                        navigate(message.action!.to)
                        setAssistantOpen(false)
                      }}
                    >
                      {message.action.label}
                    </Button>
                  ) : null}
                </Box>
              ))}
            </Stack>

            <List disablePadding>
              {[
                'Show players unavailable for the next match',
                'Suggest a balanced starting XI for 4-3-3',
                'Summarize injury risks for this week',
              ].map((hint) => (
                <ListItem key={hint} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => {
                      setAssistantInput(hint)
                    }}
                    sx={{ borderRadius: 2, border: 1, borderColor: 'divider' }}
                  >
                    <ListItemText primary={hint} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>

          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={1}>
              <Paper
                component="input"
                value={assistantInput}
                onChange={(event) => setAssistantInput(event.currentTarget.value)}
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleAssistantSend()
                  }
                }}
                placeholder="Ask Coach Assist..."
                sx={{
                  flex: 1,
                  px: 1.5,
                  py: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  font: 'inherit',
                }}
              />
              <IconButton color="primary" disabled={!assistantInput.trim() || assistantBusy} onClick={handleAssistantSend}>
                <SendIcon />
              </IconButton>
            </Stack>
            {assistantBusy ? (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                Coach Assist is analyzing form, chemistry, and metrics...
              </Typography>
            ) : null}
          </Box>
        </Box>
      </Drawer>
    </Box>
  )
}
