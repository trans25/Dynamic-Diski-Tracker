import { useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, Typography, Box, useTheme } from '@mui/material'
import { RadarChart } from '@mui/x-charts/RadarChart'
import { usePlayerSkills } from '../hooks/useCoach'
import { ErrorState, LoadingState } from './States'
import { extractErrorMessage, isForbiddenError } from '../api/apiClient'
import { chartColors } from '../theme/theme'
import { ChartActions } from './charts/ChartActions'

type PlayerSkillMatrixProps = {
  playerId?: string
}

export function PlayerSkillMatrix({ playerId }: PlayerSkillMatrixProps) {
  const { data, isLoading, isError, error, refetch } = usePlayerSkills(playerId)
  const theme = useTheme()
  const chartRef = useRef<HTMLDivElement>(null)
  const palette = theme.palette.mode === 'dark' ? chartColors.dark : chartColors.light

  const radarMetrics = useMemo(
    () => data?.points.map((point) => point.skill) ?? [],
    [data?.points],
  )

  if (!playerId) {
    return null
  }

  if (isLoading) {
    return <LoadingState label="Loading skill matrix…" />
  }

  if (isError && !isForbiddenError(error)) {
    return <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
  }

  if (!data || (isError && isForbiddenError(error))) {
    return (
      <Card variant="outlined">
        <CardHeader title="Player Skill Matrix" subheader="Skill assessment data is not available yet" />
      </Card>
    )
  }

  return (
    <Card variant="outlined">
      <CardHeader
        title="Player Skill Matrix"
        subheader={`Season ${data.season}`}
        action={
          <ChartActions
            chartRef={chartRef}
            fileName={`player-skill-matrix-${data.playerName.toLowerCase().replace(/\s+/g, '-')}`}
            title="Player Skill Matrix"
          />
        }
      />
      <CardContent>
        <Box ref={chartRef} sx={{ width: '100%' }}>
          <RadarChart
            height={320}
            radar={{ metrics: radarMetrics }}
            series={[
              {
                label: data.playerName,
                data: data.points.map((point) => point.playerValue),
                color: palette[0],
                fillArea: true,
              },
              {
                label: 'Squad Avg',
                data: data.points.map((point) => point.squadAverage),
                color: palette[2],
                fillArea: true,
              },
            ]}
            highlight="axis"
            showToolbar
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          Compare the player's current skill profile against the squad baseline.
        </Typography>
      </CardContent>
    </Card>
  )
}
