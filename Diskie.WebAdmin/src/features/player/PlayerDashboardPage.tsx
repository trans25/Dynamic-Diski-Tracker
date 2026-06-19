import { useMemo, useRef, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import { LineChart } from '@mui/x-charts/LineChart'
import { BarChart } from '@mui/x-charts/BarChart'
import { Gauge } from '@mui/x-charts/Gauge'
import { SparkLineChart } from '@mui/x-charts/SparkLineChart'
import { ScatterChart } from '@mui/x-charts/ScatterChart'
import { PageHeader } from '../../components/PageHeader'
import { StatCard } from '../../components/StatCard'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { useAuth } from '../../auth/AuthContext'
import {
  usePlayerAchievements,
  usePlayerGrowth,
  usePlayerInjuries,
  usePlayerSkills,
} from '../../hooks/useCoach'
import { extractErrorMessage, isForbiddenError } from '../../api/apiClient'
import { PlayerSkillMatrix } from '../../components/PlayerSkillMatrix'
import { TrophyCabinet } from '../../components/TrophyCabinet'
import { formatDate } from '../../utils/format'
import { chartColors } from '../../theme/theme'
import { useTheme } from '@mui/material/styles'
import { ChartActions } from '../../components/charts/ChartActions'

export function PlayerDashboardPage() {
  const { user } = useAuth()
  const theme = useTheme()
  const [selectedSeason, setSelectedSeason] = useState(new Date().getFullYear().toString())
  const [benchmarkTab, setBenchmarkTab] = useState('all')
  const trendChartRef = useRef<HTMLDivElement>(null)
  const benchmarkChartRef = useRef<HTMLDivElement>(null)
  const readinessChartRef = useRef<HTMLDivElement>(null)
  const correlationChartRef = useRef<HTMLDivElement>(null)
  const playerId = user?.id

  const growthQuery = usePlayerGrowth(playerId, selectedSeason)
  const skillsQuery = usePlayerSkills(playerId)
  const achievementsQuery = usePlayerAchievements(playerId)
  const injuriesQuery = usePlayerInjuries(playerId)

  const seasonOptions = [0, 1, 2, 3].map((offset) => String(new Date().getFullYear() - offset))

  const growthData = useMemo(
    () =>
      (growthQuery.data ?? []).map((point) => ({
        ...point,
        displayDate: formatDate(point.matchDate),
      })),
    [growthQuery.data],
  )

  const totalGoals = useMemo(
    () => growthData.reduce((sum, point) => sum + point.goals, 0),
    [growthData],
  )

  const totalAssists = useMemo(
    () => growthData.reduce((sum, point) => sum + point.assists, 0),
    [growthData],
  )

  const averageRating = useMemo(() => {
    if (growthData.length === 0) return null
    const average = growthData.reduce((sum, point) => sum + point.rating, 0) / growthData.length
    return average.toFixed(1)
  }, [growthData])

  const activeInjuries = (injuriesQuery.data ?? []).filter((injury) => injury.status !== 2)
  const latestAchievement = achievementsQuery.data?.[0]
  const latestGrowth = growthData[growthData.length - 1]
  const palette = theme.palette.mode === 'dark' ? chartColors.dark : chartColors.light
  const growthUnavailable = growthQuery.isError && isForbiddenError(growthQuery.error)
  const skillsUnavailable = skillsQuery.isError && isForbiddenError(skillsQuery.error)

  const skillBenchmark = useMemo(
    () => skillsQuery.data?.points ?? [],
    [skillsQuery.data?.points],
  )

  const benchmarkTabs = useMemo(() => {
    const position = (user?.preferredPosition ?? '').toLowerCase()
    if (position.includes('def')) {
      return [
        { value: 'all', label: 'All' },
        { value: 'defensive', label: 'Defensive' },
        { value: 'athletic', label: 'Athletic' },
        { value: 'mental', label: 'Mental' },
      ]
    }
    if (position.includes('mid')) {
      return [
        { value: 'all', label: 'All' },
        { value: 'technical', label: 'Technical' },
        { value: 'attacking', label: 'Attacking' },
        { value: 'mental', label: 'Mental' },
      ]
    }
    if (position.includes('for') || position.includes('strik') || position.includes('wing')) {
      return [
        { value: 'all', label: 'All' },
        { value: 'attacking', label: 'Attacking' },
        { value: 'technical', label: 'Technical' },
        { value: 'athletic', label: 'Athletic' },
      ]
    }
    return [
      { value: 'all', label: 'All' },
      { value: 'attacking', label: 'Attacking' },
      { value: 'technical', label: 'Technical' },
      { value: 'athletic', label: 'Athletic' },
      { value: 'defensive', label: 'Defensive' },
      { value: 'mental', label: 'Mental' },
    ]
  }, [user?.preferredPosition])

  const resolveSkillBand = (skill: string) => {
    const text = skill.toLowerCase()
    if (/finish|shot|goal|cross|drib|assist|attac/.test(text)) return 'attacking'
    if (/pass|first touch|tech|ball|vision|control/.test(text)) return 'technical'
    if (/pace|speed|stamina|strength|agility|fitness/.test(text)) return 'athletic'
    if (/tackle|mark|intercept|block|clear|defen/.test(text)) return 'defensive'
    if (/composure|decision|awareness|discipline|focus|mental|lead/.test(text)) return 'mental'
    return 'technical'
  }

  const filteredSkillBenchmark = useMemo(() => {
    if (benchmarkTab === 'all') return skillBenchmark
    return skillBenchmark.filter((point) => resolveSkillBand(point.skill) === benchmarkTab)
  }, [benchmarkTab, skillBenchmark])

  const formHeatmap = useMemo(
    () => growthData.slice(-12),
    [growthData],
  )

  const momentumSeries = useMemo(
    () => growthData.slice(-8),
    [growthData],
  )

  const weeklyCorrelation = useMemo(
    () =>
      growthData.slice(-10).map((point, index) => {
        const goalContribution = point.goals + point.assists
        const simulatedLoad = Math.max(2, Math.min(12, Math.round(4 + point.rating / 2 + goalContribution + index * 0.2)))
        const readiness = Math.max(20, Math.min(100, Math.round(point.rating * 10 + goalContribution * 4 - (activeInjuries.length > 0 ? 18 : 0))))
        return {
          id: `wk-${index}`,
          x: simulatedLoad,
          y: readiness,
          label: point.displayDate,
        }
      }),
    [activeInjuries.length, growthData],
  )

  const readinessScore = useMemo(() => {
    const baseRating = latestGrowth?.rating ? latestGrowth.rating * 10 : 55
    const consistencyBonus = growthData.length >= 3 ? 8 : 2
    const injuryPenalty = activeInjuries.length > 0 ? 24 : 0
    const fatiguePenalty = latestGrowth && (latestGrowth.goals + latestGrowth.assists) === 0 ? 4 : 0
    const raw = baseRating + consistencyBonus - injuryPenalty - fatiguePenalty
    return Math.max(15, Math.min(100, Math.round(raw)))
  }, [activeInjuries.length, growthData.length, latestGrowth])

  const readinessRisk = readinessScore >= 75 ? 'Low Risk' : readinessScore >= 50 ? 'Moderate Risk' : 'High Risk'
  const readinessColor = readinessScore >= 75 ? 'success' : readinessScore >= 50 ? 'warning' : 'error'

  const trendDirection = useMemo(() => {
    if (growthData.length < 2) return 'Stable'
    const first = growthData[0].rating
    const last = growthData[growthData.length - 1].rating
    const delta = last - first
    if (delta > 0.6) return 'Rising'
    if (delta < -0.6) return 'Declining'
    return 'Stable'
  }, [growthData])

  const getRatingTone = (rating: number) => {
    if (rating >= 8) return '#1b5e20'
    if (rating >= 6.5) return '#2e7d32'
    if (rating >= 5.5) return '#ed6c02'
    return '#c62828'
  }

  if (!user || !playerId) {
    return (
      <>
        <PageHeader title="Player Dashboard" description="Track your development in one place." />
        <EmptyState title="No player profile found" description="Sign in with a valid player account to see your dashboard." />
      </>
    )
  }

  if (growthQuery.isLoading && skillsQuery.isLoading && achievementsQuery.isLoading && injuriesQuery.isLoading) {
    return <LoadingState label="Loading your development dashboard..." />
  }

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.firstName}`}
        description="Track your progress, skills, achievements, and readiness for the next session."
        action={<Chip color="primary" label={user.isActive ? 'Active Player' : 'Inactive'} />}
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Avatar src={user.profilePhotoUrl ?? undefined} sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                {`${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  #{user.jerseyNumber ?? '--'} · {user.preferredPosition ?? 'Position not set'}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Chip size="small" label={user.qualification || 'Development Squad'} variant="outlined" />
              <Chip size="small" color={activeInjuries.length > 0 ? 'error' : 'success'} label={activeInjuries.length > 0 ? 'Injury monitored' : 'Fit to train'} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Matches Logged" value={growthData.length} caption="Tracked match performances" icon={SportsSoccerIcon} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Goals" value={totalGoals} caption="Current selected season" icon={TrendingUpIcon} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Assists" value={totalAssists} caption="Current selected season" icon={EmojiEventsIcon} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Injury Status" value={activeInjuries.length > 0 ? 'Monitor' : 'Fit'} caption={activeInjuries.length > 0 ? `${activeInjuries.length} active record(s)` : 'No active injury'} icon={LocalHospitalIcon} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card className="coach-interactive-card">
            <CardHeader
              title="Performance Trend"
              subheader={averageRating ? `Average rating: ${averageRating}/10` : 'No rating trend available yet'}
              action={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <TextField
                    select
                    size="small"
                    label="Season"
                    value={selectedSeason}
                    onChange={(event) => setSelectedSeason(event.target.value)}
                    sx={{ minWidth: 120 }}
                  >
                    {seasonOptions.map((season) => (
                      <MenuItem key={season} value={season}>
                        {season}
                      </MenuItem>
                    ))}
                  </TextField>
                  <ChartActions
                    chartRef={trendChartRef}
                    fileName={`player-performance-trend-${selectedSeason}`}
                    title="Player Performance Trend"
                  />
                </Stack>
              }
            />
            <CardContent>
              {growthQuery.isLoading ? (
                <LoadingState label="Loading performance trend..." fullPage={false} />
              ) : growthQuery.isError && !growthUnavailable ? (
                <ErrorState message={extractErrorMessage(growthQuery.error)} onRetry={growthQuery.refetch} />
              ) : growthData.length === 0 ? (
                <EmptyState title="No performance data yet" description="Your ratings and match progress will appear here once coaches record assessments." />
              ) : (
                <Box ref={trendChartRef} sx={{ width: '100%' }}>
                  <LineChart
                    height={320}
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
                        id: 'outputAxis',
                        min: 0,
                        position: 'right',
                        label: 'Goal Contributions',
                      },
                    ]}
                    series={[
                      {
                        label: 'Rating',
                        data: growthData.map((point) => point.rating),
                        yAxisId: 'ratingAxis',
                        color: palette[0],
                        showMark: 'end',
                      },
                      {
                        label: 'Goals',
                        data: growthData.map((point) => point.goals),
                        yAxisId: 'outputAxis',
                        color: palette[1],
                      },
                      {
                        label: 'Assists',
                        data: growthData.map((point) => point.assists),
                        yAxisId: 'outputAxis',
                        color: palette[2],
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
          <Card className="coach-interactive-card" sx={{ height: '100%' }}>
            <CardHeader title="Development Snapshot" subheader="Your latest progress signals" />
            <CardContent>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Latest Achievement
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {latestAchievement ? `${latestAchievement.title} · ${formatDate(latestAchievement.awardedAt)}` : 'No achievement unlocked yet.'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Injury Update
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeInjuries.length > 0
                      ? `${activeInjuries[0].injuryType} (${activeInjuries[0].bodyPart})`
                      : 'You are currently marked fit.'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Focus For Next Session
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {skillsQuery.data?.points?.length
                      ? `Keep improving your ${skillsQuery.data.points[0].skill.toLowerCase()} and consistency across training.`
                      : 'Skill assessments will appear here once coaches evaluate your development.'}
                  </Typography>
                </Box>
                {activeInjuries.length > 0 ? (
                  <Alert severity="warning">
                    Follow your recovery plan and consult your coach before full return to play.
                  </Alert>
                ) : (
                  <Alert severity="success">
                    Stay consistent in training and keep pushing your development goals.
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardHeader
              title="Skill Benchmark Comparison"
              subheader="Compare your current profile against squad average baselines"
              action={
                <ChartActions
                  chartRef={benchmarkChartRef}
                  fileName={`player-skill-benchmark-${selectedSeason}`}
                  title="Player Skill Benchmark Comparison"
                />
              }
            />
            <CardContent>
              <Tabs
                value={benchmarkTab}
                onChange={(_event, value) => setBenchmarkTab(value)}
                variant="scrollable"
                allowScrollButtonsMobile
                sx={{ mb: 1 }}
              >
                {benchmarkTabs.map((tab) => (
                  <Tab key={tab.value} value={tab.value} label={tab.label} />
                ))}
              </Tabs>
              <Divider sx={{ mb: 2 }} />
              {skillsQuery.isLoading ? (
                <LoadingState label="Loading skill benchmarks..." fullPage={false} />
              ) : skillsQuery.isError && !skillsUnavailable ? (
                <ErrorState message={extractErrorMessage(skillsQuery.error)} onRetry={skillsQuery.refetch} />
              ) : filteredSkillBenchmark.length === 0 ? (
                <EmptyState
                  title="No benchmark data in this category"
                  description="Choose another tab or wait for more coaching assessments to unlock this comparison."
                />
              ) : (
                <Box ref={benchmarkChartRef} sx={{ width: '100%' }}>
                  <BarChart
                    height={320}
                    xAxis={[
                      {
                        scaleType: 'band',
                        data: filteredSkillBenchmark.map((point) => point.skill),
                      },
                    ]}
                    yAxis={[
                      {
                        min: 0,
                        max: 10,
                        label: 'Score',
                      },
                    ]}
                    series={[
                      {
                        label: 'You',
                        data: filteredSkillBenchmark.map((point) => point.playerValue),
                        color: palette[0],
                      },
                      {
                        label: 'Squad Avg',
                        data: filteredSkillBenchmark.map((point) => point.squadAverage),
                        color: palette[3] ?? palette[1],
                      },
                    ]}
                    grid={{ horizontal: true }}
                    showToolbar
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Readiness & Risk"
              subheader="Live score based on form, consistency, and injury status"
              action={
                <ChartActions
                  chartRef={readinessChartRef}
                  fileName={`player-readiness-${selectedSeason}`}
                  title="Player Readiness and Risk"
                />
              }
            />
            <CardContent>
              <Box ref={readinessChartRef} sx={{ width: '100%' }}>
                <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Gauge
                    width={260}
                    height={180}
                    value={readinessScore}
                    startAngle={-110}
                    endAngle={110}
                    valueMin={0}
                    valueMax={100}
                    text={({ value }) => `${Math.round(value ?? 0)}%`}
                  />
                  <Stack direction="row" spacing={1}>
                    <Chip label={readinessRisk} color={readinessColor} />
                    <Chip label={`Form: ${trendDirection}`} variant="outlined" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    {readinessScore >= 75
                      ? 'You are match-ready. Maintain workload consistency and keep your recovery routine.'
                      : readinessScore >= 50
                        ? 'Readiness is moderate. Focus on training quality and controlled minutes.'
                        : 'High risk detected. Prioritize medical and conditioning guidance before high-intensity play.'}
                  </Typography>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title="Momentum Trends"
              subheader="Recent micro-trends in rating and output"
            />
            <CardContent>
              {momentumSeries.length === 0 ? (
                <EmptyState title="No momentum data yet" description="Momentum trends will show once match ratings are available." />
              ) : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Rating Momentum
                        </Typography>
                        <SparkLineChart
                          height={72}
                          data={momentumSeries.map((point) => point.rating)}
                          showTooltip
                          color={palette[0]}
                          area
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Goal Momentum
                        </Typography>
                        <SparkLineChart
                          height={72}
                          data={momentumSeries.map((point) => point.goals)}
                          showTooltip
                          color={palette[1]}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Assist Momentum
                        </Typography>
                        <SparkLineChart
                          height={72}
                          data={momentumSeries.map((point) => point.assists)}
                          showTooltip
                          color={palette[2]}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title="Weekly Load vs Readiness Correlation"
              subheader="Relationship between workload intensity and player readiness"
              action={
                <ChartActions
                  chartRef={correlationChartRef}
                  fileName={`player-load-readiness-${selectedSeason}`}
                  title="Weekly Load vs Readiness Correlation"
                />
              }
            />
            <CardContent>
              {weeklyCorrelation.length === 0 ? (
                <EmptyState
                  title="No correlation data yet"
                  description="This panel appears once enough match periods are available for trend modelling."
                />
              ) : (
                <Box ref={correlationChartRef} sx={{ width: '100%' }}>
                  <ScatterChart
                    height={320}
                    xAxis={[{ label: 'Weekly Load (sessions/intensity)', min: 0, max: 12 }]}
                    yAxis={[{ label: 'Readiness Score', min: 0, max: 100 }]}
                    series={[
                      {
                        label: 'Weekly Points',
                        data: weeklyCorrelation,
                        color: palette[0],
                        markerSize: 8,
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

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title="Recent Match Form Heatmap"
              subheader="Last 12 performances by match rating"
            />
            <CardContent>
              {formHeatmap.length === 0 ? (
                <EmptyState
                  title="No form history yet"
                  description="Your match form heatmap will appear once ratings are captured."
                />
              ) : (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                  {formHeatmap.map((item) => (
                    <Box
                      key={`${item.matchDate}-${item.displayDate}`}
                      sx={{
                        minWidth: 96,
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: getRatingTone(item.rating),
                        color: '#ffffff',
                      }}
                    >
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {item.displayDate}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {item.rating.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.92 }}>
                        G{item.goals} · A{item.assists}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <PlayerSkillMatrix playerId={playerId} />
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <TrophyCabinet playerId={playerId} />
        </Grid>
      </Grid>
    </>
  )
}
