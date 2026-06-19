import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import CreditScoreIcon from '@mui/icons-material/CreditScore'
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { extractErrorMessage } from '../../api/apiClient'
import { useLiveMatch } from '../../hooks/useCoach'
import type { MatchEventKind, MatchSide } from '../../api/types'

const ACTIONS: Array<{ kind: MatchEventKind; label: string; icon: typeof AddCircleIcon }> = [
  { kind: 'Goal', label: '+ Goal', icon: AddCircleIcon },
  { kind: 'Assist', label: '+ Assist', icon: PersonAddIcon },
  { kind: 'YellowCard', label: 'Yellow Card', icon: CreditScoreIcon },
]

function formatClock(secondsRemaining: number) {
  const minutes = Math.max(0, Math.floor(secondsRemaining / 60))
  const seconds = Math.max(0, secondsRemaining % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function LiveMatch() {
  const { matchId = '' } = useParams<{ matchId: string }>()
  const { liveMatchQuery, postMatchEvent } = useLiveMatch(matchId)
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [selectedSide, setSelectedSide] = useState<MatchSide>('home')
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)

  const match = liveMatchQuery.data
  const players = match?.players ?? []
  const events = match?.events ?? []

  useEffect(() => {
    if (match) {
      setSecondsRemaining(match.clockSecondsRemaining)
      if (!selectedPlayerId && match.players[0]) {
        setSelectedPlayerId(match.players[0].playerId)
      }
    }
  }, [match, selectedPlayerId])

  useEffect(() => {
    if (secondsRemaining == null) return
    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => (current == null || current <= 0 ? 0 : current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [secondsRemaining])

  const displayClock = secondsRemaining == null ? '00:00' : formatClock(secondsRemaining)
  const minute = useMemo(() => {
    if (secondsRemaining == null) return 0
    return Math.min(90, 90 - Math.floor(secondsRemaining / 60))
  }, [secondsRemaining])

  const activePlayer = players.find((player) => player.playerId === selectedPlayerId) ?? players[0]

  const handleAction = async (kind: MatchEventKind) => {
    if (!match || !activePlayer) return
    await postMatchEvent.mutateAsync({
      playerId: activePlayer.playerId,
      playerName: activePlayer.playerName,
      kind,
      side: selectedSide,
      minute,
    })
  }

  if (liveMatchQuery.isLoading) {
    return <LoadingState label="Loading live match…" />
  }

  if (liveMatchQuery.isError || !match) {
    return (
      <>
        <PageHeader title="Live Match" description="Track the game in real time." />
        <ErrorState
          message={extractErrorMessage(liveMatchQuery.error, 'Could not load live match')}
          onRetry={liveMatchQuery.refetch}
        />
      </>
    )
  }

  const scoreboard = `${match.homeTeamName} ${match.homeScore} - ${match.awayScore} ${match.awayTeamName}`
  const topPlayer = [...players].sort((a, b) => b.metricScore - a.metricScore)[0]

  return (
    <>
      <PageHeader
        title="Live Match"
        description="Big scoreboard, ticking clock, and instant stat updates when events are recorded."
        action={
          <Chip
            color={match.status === 'Live' ? 'success' : match.status === 'Paused' ? 'warning' : 'default'}
            label={match.status}
          />
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack spacing={2.5}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="overline" color="text.secondary">
                    {match.formation}
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                    {scoreboard}
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                    {displayClock}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    90-minute clock
                  </Typography>
                </Box>

                <Box>
                  <Stack direction="row" spacing={1} sx={{ mb: 1.25, flexWrap: 'wrap' }}>
                    {ACTIONS.map((action) => {
                      const Icon = action.icon
                      return (
                        <Button
                          key={action.kind}
                          size="large"
                          variant="contained"
                          startIcon={<Icon />}
                          onClick={() => handleAction(action.kind)}
                          disabled={postMatchEvent.isPending || !activePlayer}
                          sx={{ minWidth: 150 }}
                        >
                          {action.label}
                        </Button>
                      )
                    })}
                  </Stack>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      select
                      size="small"
                      label="Player"
                      value={selectedPlayerId}
                      onChange={(e) => setSelectedPlayerId(e.target.value)}
                      fullWidth
                    >
                      {players.map((player) => (
                        <MenuItem key={player.playerId} value={player.playerId}>
                          {player.playerName}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      size="small"
                      label="Side"
                      value={selectedSide}
                      onChange={(e) => setSelectedSide(e.target.value as MatchSide)}
                      fullWidth
                    >
                      <MenuItem value="home">Home</MenuItem>
                      <MenuItem value="away">Away</MenuItem>
                    </TextField>
                  </Stack>
                </Box>

                {postMatchEvent.isPending ? (
                  <LinearProgress />
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Star Player
                </Typography>
                {topPlayer ? (
                  <>
                    <Typography variant="h4" sx={{ fontWeight: 900 }}>
                      {topPlayer.playerName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Metric Score: {topPlayer.metricScore}
                    </Typography>
                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Goals {topPlayer.goals} · Assists {topPlayer.assists} · Yellow Cards {topPlayer.yellowCards}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No players loaded yet.
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Player Stats
                </Typography>
                <Stack spacing={1.5}>
                  {players.map((player) => (
                    <Box key={player.playerId}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {player.playerName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {player.metricScore}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.max(0, Math.min(100, player.metricScore))}
                        sx={{ height: 8, borderRadius: 999 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        G {player.goals} · A {player.assists} · YC {player.yellowCards}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Recent Events
              </Typography>
              {events.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No events recorded yet.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {events.map((event) => (
                    <Stack
                      key={event.id}
                      direction="row"
                      spacing={1}
                      sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <Typography variant="body2">
                        {event.minute}' {event.kind} - {event.playerName}
                      </Typography>
                      <Chip size="small" variant="outlined" label={event.side.toUpperCase()} />
                    </Stack>
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
