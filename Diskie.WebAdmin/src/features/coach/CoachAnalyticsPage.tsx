import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { LineChart } from '@mui/x-charts/LineChart'
import { ScatterChart } from '@mui/x-charts/ScatterChart'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import SportsScoreIcon from '@mui/icons-material/SportsScore'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import HealingIcon from '@mui/icons-material/Healing'
import { PageHeader } from '../../components/PageHeader'
import { StatCard } from '../../components/StatCard'
import { ErrorState, LoadingState } from '../../components/States'
import {
  useChemistryPairs,
  useCoachAnalytics,
  useCoachTeams,
  useMetricInsights,
  usePlayerGrowth,
  usePositionalDepth,
  useSquadFatigue,
  useTrainingCorrelation,
} from '../../hooks/useCoach'
import { extractErrorMessage } from '../../api/apiClient'
import { chartColors } from '../../theme/theme'
import { TrainingAttendanceTable } from '../../components/TrainingAttendanceTable'
import { formatDate } from '../../utils/format'
import { ChartActions } from '../../components/charts/ChartActions'

export function CoachAnalyticsPage() {
  const theme = useTheme()
  const growthChartRef = useRef<HTMLDivElement>(null)
  const correlationChartRef = useRef<HTMLDivElement>(null)
  const teamsQuery = useCoachTeams()
  const analyticsQuery = useCoachAnalytics()
  const metricInsightsQuery = useMetricInsights()
  const starPlayerId = metricInsightsQuery.data?.starPlayerId ?? undefined
  const [selectedSeason, setSelectedSeason] = useState(new Date().getFullYear().toString())
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>()
  const [attendanceSessionDate, setAttendanceSessionDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [fatigueSearch, setFatigueSearch] = useState('')
  const [chemistrySearch, setChemistrySearch] = useState('')
  const [chemistryPage, setChemistryPage] = useState(1)
  const chemistryPageSize = 6

  useEffect(() => {
    if (!selectedTeamId && teamsQuery.data && teamsQuery.data.length > 0) {
      setSelectedTeamId(teamsQuery.data[0].id)
    }
  }, [selectedTeamId, teamsQuery.data])

  const growthQuery = usePlayerGrowth(starPlayerId, selectedSeason)
  const positionalDepthQuery = usePositionalDepth()
  const fatigueQuery = useSquadFatigue()
  const trainingCorrelationQuery = useTrainingCorrelation()
  const chemistryPairsQuery = useChemistryPairs(5)

  const data = analyticsQuery.data
  const palette =
    theme.palette.mode === 'dark' ? chartColors.dark : chartColors.light

  const growthData = useMemo(() => {
    const source = growthQuery.data ?? []
    return source.map((point, index) => {
      const window = source.slice(Math.max(0, index - 2), index + 1)
      const trend = window.reduce((sum, row) => sum + row.rating, 0) / window.length
      return {
        matchDate: point.matchDate,
        displayDate: formatDate(point.matchDate),
        rating: point.rating,
        trend,
        goals: point.goals,
        assists: point.assists,
      }
    })
  }, [growthQuery.data])

  const growthDelta = useMemo(() => {
    if (growthData.length < 2) return 0
    return growthData[growthData.length - 1].rating - growthData[0].rating
  }, [growthData])

  const growthBadgeLabel = growthDelta >= 0
    ? `Improving (+${growthDelta.toFixed(1)} avg)`
    : `Needs Attention (${growthDelta.toFixed(1)} avg)`

  const correlationData = trainingCorrelationQuery.data ?? []

  const rSquared = useMemo(() => {
    if (correlationData.length < 2) return 0
    const n = correlationData.length
    const sumX = correlationData.reduce((acc, row) => acc + row.trainingCount, 0)
    const sumY = correlationData.reduce((acc, row) => acc + row.matchRating, 0)
    const sumXY = correlationData.reduce((acc, row) => acc + row.trainingCount * row.matchRating, 0)
    const sumX2 = correlationData.reduce((acc, row) => acc + row.trainingCount * row.trainingCount, 0)
    const sumY2 = correlationData.reduce((acc, row) => acc + row.matchRating * row.matchRating, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    if (denominator === 0) return 0
    const r = numerator / denominator
    return Math.max(0, Math.min(1, r * r))
  }, [correlationData])

  const regressionLine = useMemo(() => {
    if (correlationData.length < 2) return [] as Array<{ trainingCount: number; y: number }>

    const n = correlationData.length
    const sumX = correlationData.reduce((acc, row) => acc + row.trainingCount, 0)
    const sumY = correlationData.reduce((acc, row) => acc + row.matchRating, 0)
    const sumXY = correlationData.reduce((acc, row) => acc + row.trainingCount * row.matchRating, 0)
    const sumX2 = correlationData.reduce((acc, row) => acc + row.trainingCount * row.trainingCount, 0)
    const denominator = n * sumX2 - sumX * sumX

    if (denominator === 0) return []

    const slope = (n * sumXY - sumX * sumY) / denominator
    const intercept = (sumY - slope * sumX) / n
    const minX = Math.min(...correlationData.map(x => x.trainingCount))
    const maxX = Math.max(...correlationData.map(x => x.trainingCount))

    return [
      { trainingCount: minX, y: intercept + slope * minX },
      { trainingCount: maxX, y: intercept + slope * maxX },
    ]
  }, [correlationData])

  const positionalDepthData = positionalDepthQuery.data ?? []
  const fatigueData = fatigueQuery.data ?? []
  const chemistryData = chemistryPairsQuery.data ?? []
  const filteredFatigueData = useMemo(
    () =>
      fatigueData.filter((item) => {
        const search = fatigueSearch.trim().toLowerCase()
        return search.length === 0 || item.playerName.toLowerCase().includes(search) || item.status.toLowerCase().includes(search)
      }),
    [fatigueData, fatigueSearch],
  )
  const filteredChemistryData = useMemo(
    () =>
      chemistryData.filter((pair) => {
        const search = chemistrySearch.trim().toLowerCase()
        return (
          search.length === 0 ||
          pair.playerAName.toLowerCase().includes(search) ||
          pair.playerBName.toLowerCase().includes(search)
        )
      }),
    [chemistryData, chemistrySearch],
  )
  const chemistryPageCount = Math.max(1, Math.ceil(filteredChemistryData.length / chemistryPageSize))
  const pagedChemistryData = filteredChemistryData.slice((chemistryPage - 1) * chemistryPageSize, chemistryPage * chemistryPageSize)
  const seasonOptions = [0, 1, 2, 3].map((offset) => String(new Date().getFullYear() - offset))

  if (analyticsQuery.isLoading || metricInsightsQuery.isLoading) {
    return <LoadingState label="Loading analytics…" />
  }

  if (analyticsQuery.isError || !data) {
    return (
      <>
        <PageHeader title="Analytics & Performance" description="Track team and individual player metrics over time" />
        <ErrorState message={extractErrorMessage(analyticsQuery.error)} onRetry={analyticsQuery.refetch} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Analytics & Performance"
        description="Grow your own talent with measurable insights for performance, welfare, and squad decisions."
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Win Rate"
            value={`${data.winRate}%`}
            caption={`${data.wins}W · ${data.losses}L · ${data.draws}D`}
            icon={EmojiEventsIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Matches Played"
            value={data.totalMatches}
            caption="Across all teams"
            icon={SportsScoreIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Attendance"
            value={`${data.overallAttendanceRate}%`}
            caption="Overall training & match"
            icon={EventAvailableIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Active Injuries"
            value={data.activeInjuryCount}
            caption={`${data.totalInjuryCount} recorded total`}
            icon={HealingIcon}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Player Growth Timeline"
              subheader="Rating progression over the last 10 matches"
              action={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <TextField
                    select
                    size="small"
                    label="Season"
                    value={selectedSeason}
                    onChange={(event) => setSelectedSeason(event.target.value)}
                    sx={{ minWidth: 110 }}
                  >
                    {seasonOptions.map((season) => (
                      <MenuItem key={season} value={season}>
                        {season}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Chip
                    size="small"
                    color={growthDelta >= 0 ? 'success' : 'warning'}
                    label={growthBadgeLabel}
                  />
                  <ChartActions
                    chartRef={growthChartRef}
                    fileName={`coach-growth-timeline-${selectedSeason}`}
                    title="Coach Growth Timeline"
                  />
                </Stack>
              }
            />
            <CardContent>
              {growthQuery.isLoading ? (
                <LoadingState label="Loading growth timeline…" />
              ) : growthQuery.isError ? (
                <ErrorState message={extractErrorMessage(growthQuery.error)} onRetry={growthQuery.refetch} />
              ) : growthData.length === 0 ? (
                <Alert severity="info">
                  No match-rating history available yet. Record at least two match assessments for trend analysis.
                </Alert>
              ) : (
                <Box ref={growthChartRef} sx={{ width: '100%' }}>
                  <LineChart
                    height={340}
                    xAxis={[
                      {
                        scaleType: 'band',
                        data: growthData.map((point) => point.displayDate),
                      },
                    ]}
                    yAxis={[
                      {
                        id: 'ratingAxis',
                        min: 0,
                        max: 10,
                        label: 'Rating',
                      },
                      {
                        id: 'eventsAxis',
                        min: 0,
                        label: 'Goals + Assists',
                        position: 'right',
                      },
                    ]}
                    series={[
                      {
                        label: 'Rating',
                        data: growthData.map((point) => point.rating),
                        yAxisId: 'ratingAxis',
                        color: palette[0],
                        showMark: true,
                      },
                      {
                        label: 'Trendline (MA)',
                        data: growthData.map((point) => point.trend),
                        yAxisId: 'ratingAxis',
                        color: palette[2],
                        showMark: false,
                      },
                      {
                        label: 'Goals',
                        data: growthData.map((point) => point.goals),
                        yAxisId: 'eventsAxis',
                        color: palette[1],
                      },
                      {
                        label: 'Assists',
                        data: growthData.map((point) => point.assists),
                        yAxisId: 'eventsAxis',
                        color: palette[3] ?? palette[0],
                      },
                    ]}
                    grid={{ horizontal: true, vertical: true }}
                    axisHighlight={{ x: 'band' }}
                    showToolbar
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Smart Fatigue Monitor"
              subheader="Minutes played in the last 7 days"
              action={
                <TextField
                  size="small"
                  label="Search"
                  value={fatigueSearch}
                  onChange={(event) => setFatigueSearch(event.target.value)}
                  placeholder="Player or status"
                  sx={{ minWidth: 180 }}
                />
              }
            />
            <CardContent>
              {fatigueQuery.isLoading ? (
                <LoadingState label="Loading fatigue…" />
              ) : fatigueQuery.isError ? (
                <ErrorState message={extractErrorMessage(fatigueQuery.error)} onRetry={fatigueQuery.refetch} />
              ) : fatigueData.length === 0 ? (
                <Alert severity="info">No squad workload data found for the last 7 days.</Alert>
              ) : (
                <Stack spacing={1}>
                  {filteredFatigueData.map((item) => (
                    <Stack key={item.playerId} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.playerName}
                      </Typography>
                      <Chip
                        size="small"
                        color={item.status === 'Exhausted' ? 'error' : item.status === 'Tired' ? 'warning' : 'success'}
                        label={`${item.status} · ${item.minutesPlayedLast7Days} min`}
                      />
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Positional Depth Chart" subheader="Average rating per position" />
            <CardContent>
              {positionalDepthQuery.isLoading ? (
                <LoadingState label="Loading positional depth…" />
              ) : positionalDepthQuery.isError ? (
                <ErrorState message={extractErrorMessage(positionalDepthQuery.error)} onRetry={positionalDepthQuery.refetch} />
              ) : positionalDepthData.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  No position data available
                </Box>
              ) : (
                <BarChart
                  height={300}
                  layout="horizontal"
                  xAxis={[
                    {
                      data: positionalDepthData.map((p) => p.averageRating),
                      min: 0,
                      max: 10,
                    },
                  ]}
                  yAxis={[
                    {
                      scaleType: 'band',
                      data: positionalDepthData.map((p) => p.position),
                    },
                  ]}
                  series={[
                    {
                      data: positionalDepthData.map((p) => p.averageRating),
                      label: 'Avg Rating',
                      color: palette[0],
                    },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Training-to-Match Correlation"
              subheader={`R-squared: ${rSquared.toFixed(3)}`}
              action={
                <ChartActions
                  chartRef={correlationChartRef}
                  fileName="training-correlation"
                  title="Training to Match Correlation"
                />
              }
            />
            <CardContent>
              {trainingCorrelationQuery.isLoading ? (
                <LoadingState label="Loading training correlation…" />
              ) : trainingCorrelationQuery.isError ? (
                <ErrorState
                  message={extractErrorMessage(trainingCorrelationQuery.error)}
                  onRetry={trainingCorrelationQuery.refetch}
                />
              ) : correlationData.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  Not enough data to compute correlation.
                </Box>
              ) : (
                <Box ref={correlationChartRef} sx={{ width: '100%' }}>
                  <ScatterChart
                    height={320}
                    xAxis={[
                      {
                        min: Math.min(...correlationData.map((point) => point.trainingCount)),
                        max: Math.max(...correlationData.map((point) => point.trainingCount)),
                        label: 'Training Sessions',
                      },
                    ]}
                    yAxis={[
                      {
                        min: 0,
                        max: 10,
                        label: 'Match Rating',
                      },
                    ]}
                    series={[
                      {
                        label: 'Players',
                        data: correlationData.map((point, index) => ({
                          id: `player-${index}`,
                          x: point.trainingCount,
                          y: point.matchRating,
                        })),
                        color: palette[1],
                        markerSize: 7,
                      },
                      {
                        label: 'Regression',
                        data: regressionLine.map((point, index) => ({
                          id: `regression-${index}`,
                          x: point.trainingCount,
                          y: point.y,
                        })),
                        color: palette[2],
                        markerSize: 10,
                      },
                    ]}
                    grid={{ horizontal: true, vertical: true }}
                    axisHighlight={{ x: 'line', y: 'line' }}
                    showToolbar
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                select
                size="small"
                label="Squad"
                value={selectedTeamId ?? ''}
                onChange={(event) => setSelectedTeamId(event.target.value)}
                fullWidth
              >
                {(teamsQuery.data ?? []).map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                label="Session Date"
                type="date"
                value={attendanceSessionDate}
                onChange={(event) => setAttendanceSessionDate(event.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            <TrainingAttendanceTable
              teamId={selectedTeamId}
              sessionDate={attendanceSessionDate}
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title="Chemistry Pairing"
              subheader="Top duos ranked by combined impact"
              action={
                <TextField
                  size="small"
                  label="Search"
                  value={chemistrySearch}
                  onChange={(event) => {
                    setChemistrySearch(event.target.value)
                    setChemistryPage(1)
                  }}
                  placeholder="Player names"
                  sx={{ minWidth: 180 }}
                />
              }
            />
            <CardContent>
              {chemistryPairsQuery.isLoading ? (
                <LoadingState label="Loading chemistry pairs…" />
              ) : chemistryPairsQuery.isError ? (
                <ErrorState message={extractErrorMessage(chemistryPairsQuery.error)} onRetry={chemistryPairsQuery.refetch} />
              ) : chemistryData.length === 0 ? (
                <Alert severity="info">No pair insights available yet for completed fixtures.</Alert>
              ) : (
                <>
                  <Grid container spacing={2}>
                    {pagedChemistryData.map((pair) => (
                      <Grid key={`${pair.playerAId}-${pair.playerBId}`} size={{ xs: 12, md: 6, lg: 4 }}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {pair.playerAName} + {pair.playerBName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Matches together: {pair.matchesTogether}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Win %: {pair.winPercentage}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Goals/Game: {pair.goalsPerGame}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Combined Impact: {pair.combinedGoalContributionsPerGame}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                  {filteredChemistryData.length > chemistryPageSize ? (
                    <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 2 }}>
                      <Pagination count={chemistryPageCount} page={chemistryPage} onChange={(_e, value) => setChemistryPage(value)} color="primary" />
                    </Stack>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}
