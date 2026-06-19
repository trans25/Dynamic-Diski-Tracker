import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups'
import PersonIcon from '@mui/icons-material/Person'
import EventIcon from '@mui/icons-material/Event'
import HealingIcon from '@mui/icons-material/Healing'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import CampaignIcon from '@mui/icons-material/Campaign'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { StatCard } from '../../components/StatCard'
import { useCoachDashboard, useCoachInjuries, useCoachRoster, useCoachTeams } from '../../hooks/useCoach'
import { extractErrorMessage } from '../../api/apiClient'
import { coachService } from '../../api/services/coachService'
import type { PlayerGrowthPointViewModel } from '../../api/types'
import { formatDate } from '../../utils/format'
import { formatTime } from '../../utils/coachFormat'

function formatCountdown(targetDate: string): string {
  const now = Date.now()
  const target = new Date(targetDate).getTime()
  const diffMs = Math.max(0, target - now)
  const totalMins = Math.floor(diffMs / 60000)
  const days = Math.floor(totalMins / (60 * 24))
  const hours = Math.floor((totalMins % (60 * 24)) / 60)
  const mins = totalMins % 60

  if (days > 0) return `${days}d ${hours}h ${mins}m`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function CoachOverviewPage() {
  const dashboardQuery = useCoachDashboard()
  const injuriesQuery = useCoachInjuries()
  const teamsQuery = useCoachTeams()

  const defaultTeamId = teamsQuery.data?.[0]?.id
  const rosterQuery = useCoachRoster(defaultTeamId)

  const performerCandidates = useMemo(() => {
    return (rosterQuery.data ?? [])
      .filter((player) => player.isActive)
      .sort((a, b) => Number(a.hasActiveInjury) - Number(b.hasActiveInjury))
      .slice(0, 14)
  }, [rosterQuery.data])

  const growthQueries = useQueries({
    queries: performerCandidates.map((player) => ({
      queryKey: ['coach', 'overview', 'player-growth', player.playerId],
      queryFn: () => coachService.getPlayerGrowth(player.playerId),
      enabled: Boolean(defaultTeamId),
      staleTime: 10 * 60 * 1000,
    })),
  })

  const performerRows = useMemo(() => {
    return performerCandidates.map((player, index) => {
      const points = (growthQueries[index]?.data ?? []) as PlayerGrowthPointViewModel[]
      const totals = points.reduce(
        (acc, point) => {
          acc.goals += point.goals
          acc.assists += point.assists
          return acc
        },
        { goals: 0, assists: 0 },
      )

      return {
        playerId: player.playerId,
        name: `${player.firstName} ${player.lastName}`.trim(),
        goals: totals.goals,
        assists: totals.assists,
      }
    })
  }, [growthQueries, performerCandidates])

  const topGoalScorers = useMemo(
    () =>
      [...performerRows]
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 3)
        .map((row) => ({
          name: row.name,
          value: `${row.goals} goal${row.goals === 1 ? '' : 's'}`,
        })),
    [performerRows],
  )

  const topAssistProviders = useMemo(
    () =>
      [...performerRows]
        .sort((a, b) => b.assists - a.assists)
        .slice(0, 3)
        .map((row) => ({
          name: row.name,
          value: `${row.assists} assist${row.assists === 1 ? '' : 's'}`,
        })),
    [performerRows],
  )

  const hasPerformerData = performerRows.some((row) => row.goals > 0 || row.assists > 0)
  const performersLoading = growthQueries.some((query) => query.isLoading)

  if (dashboardQuery.isLoading) {
    return <LoadingState label="Loading command center..." />
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <>
        <PageHeader title="Dashboard" description="Matchday command center" />
        <ErrorState message={extractErrorMessage(dashboardQuery.error)} onRetry={dashboardQuery.refetch} />
      </>
    )
  }

  const dashboard = dashboardQuery.data
  const nextFixture = [...dashboard.upcomingFixtures]
    .filter((fixture) => !fixture.isCancelled)
    .sort((a, b) => new Date(a.fixtureDate).getTime() - new Date(b.fixtureDate).getTime())[0]

  const activeInjuries = (injuriesQuery.data ?? []).filter((item) => item.status === 0).slice(0, 5)

  return (
    <>
      <PageHeader
        title="Command Center"
        description="Real-time coaching view: match readiness, squad health, and team communication."
        action={
          <Button variant="contained" component={RouterLink} to="/coach/schedule">
            Open Match Center
          </Button>
        }
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="My Teams" value={dashboard.teamCount} caption="Assigned clubs" icon={GroupsIcon} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Players" value={dashboard.playerCount} caption="Available squad members" icon={PersonIcon} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Upcoming Fixtures" value={dashboard.upcomingFixtureCount} caption="Matches and sessions" icon={EventIcon} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Active Injuries" value={dashboard.activeInjuryCount} caption="Players unavailable" icon={HealingIcon} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card className="coach-interactive-card" sx={{ height: '100%' }}>
            <CardHeader
              avatar={<SportsSoccerIcon color="primary" />}
              title="Match Day Countdown"
              subheader="Next fixture focus"
            />
            <Divider />
            <CardContent>
              {nextFixture ? (
                <Stack spacing={1.25}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {nextFixture.opponent ? `vs ${nextFixture.opponent}` : 'Training Session'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(nextFixture.fixtureDate)} at {formatTime(nextFixture.startTime)}
                    {nextFixture.venue ? ` · ${nextFixture.venue}` : ''}
                  </Typography>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Kick-off in {formatCountdown(nextFixture.fixtureDate)}
                  </Alert>
                </Stack>
              ) : (
                <EmptyState title="No upcoming fixtures" description="Create your next match from Match Center." />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card className="coach-interactive-card" sx={{ height: '100%' }}>
            <CardHeader title="Injury Brief" subheader="Currently unavailable players" />
            <Divider />
            <CardContent>
              {injuriesQuery.isLoading ? (
                <Typography variant="body2" color="text.secondary">Loading injury brief...</Typography>
              ) : activeInjuries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No active injuries right now.</Typography>
              ) : (
                <List disablePadding>
                  {activeInjuries.map((injury) => (
                    <ListItem key={injury.id} disableGutters sx={{ py: 0.75 }}>
                      <ListItemText
                        primary={injury.injuryType}
                        secondary={
                          injury.estimatedReturnDate
                            ? `Expected return: ${formatDate(injury.estimatedReturnDate)}`
                            : 'Expected return not set'
                        }
                      />
                      <Chip size="small" color="error" label="Unavailable" />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card className="coach-interactive-card" sx={{ height: '100%' }}>
            <CardHeader
              avatar={<TrendingUpIcon color="primary" />}
              title="Form Guide / Top Performers"
              subheader="Top 3 scorers and assist providers this season"
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Goal Scorers</Typography>
                  <Stack spacing={1}>
                    {performersLoading ? (
                      <Typography variant="body2" color="text.secondary">
                        Calculating top scorers...
                      </Typography>
                    ) : hasPerformerData ? (
                      topGoalScorers.map((player, index) => (
                        <PaperRow key={`goal-${index}`} rank={index + 1} name={player.name} value={player.value} />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Match event data is still building for this squad.
                      </Typography>
                    )}
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Assist Providers</Typography>
                  <Stack spacing={1}>
                    {performersLoading ? (
                      <Typography variant="body2" color="text.secondary">
                        Calculating assist leaders...
                      </Typography>
                    ) : hasPerformerData ? (
                      topAssistProviders.map((player, index) => (
                        <PaperRow key={`assist-${index}`} rank={index + 1} name={player.name} value={player.value} />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Assist leaderboard will appear as live events are recorded.
                      </Typography>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card className="coach-interactive-card" sx={{ height: '100%' }}>
            <CardHeader
              avatar={<CampaignIcon color="primary" />}
              title="Announcements Feed"
              subheader="Latest club communication"
            />
            <Divider />
            <CardContent sx={{ maxHeight: 320, overflowY: 'auto' }}>
              {dashboard.recentAnnouncements.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No announcements available.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {dashboard.recentAnnouncements.map((announcement) => (
                    <Box key={announcement.id}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {announcement.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        {announcement.body}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(announcement.createdAt)}
                      </Typography>
                      <Divider sx={{ mt: 1.25 }} />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

function PaperRow({ rank, name, value }: { rank: number; name: string; value: string }) {
  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Chip size="small" color="primary" label={`#${rank}`} />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{name}</Typography>
          <Typography variant="caption" color="text.secondary">{value}</Typography>
        </Box>
      </Stack>
    </Box>
  )
}
