import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Card, CardContent, CardHeader, Chip, LinearProgress, Stack, Typography } from '@mui/material'
import { ErrorState, LoadingState } from './States'
import { extractErrorMessage } from '../api/apiClient'
import { useMetricInsights } from '../hooks/useCoach'

type MetricInsightsProps = {
  className?: string
}

function ScoreRow({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <Stack spacing={0.75}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {value}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Math.max(0, Math.min(100, value))}
        sx={{ height: 10, borderRadius: 999 }}
      />
    </Stack>
  )
}

function getMatchRating(score: number): string {
  return `${(score / 10).toFixed(1)}/10`
}

function getScoreTone(value: number): 'success' | 'warning' | 'error' {
  if (value >= 70) return 'success'
  if (value >= 50) return 'warning'
  return 'error'
}

function getPerformanceVerdict(formScore: number, h2hScore: number): string {
  const blended = Math.round((formScore + h2hScore) / 2)
  if (blended >= 75) return 'Strong Competitive Edge'
  if (blended >= 55) return 'Balanced Contest Outlook'
  return 'High-Risk Match Outlook'
}

export function MetricInsights({ className }: MetricInsightsProps) {
  const { data, isLoading, isError, error, refetch } = useMetricInsights()

  if (isLoading) {
    return <LoadingState label="Loading performance metrics…" />
  }

  if (isError || !data) {
    return (
      <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
    )
  }

  return (
    <Card className={className} variant="outlined">
      <CardHeader
        title="📊 Statistical Match Insights"
        subheader="Performance Metrics"
        sx={{ pb: 0.5 }}
      />
      <CardContent>
        <Stack spacing={2.25}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Formation
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              {data.formation}
            </Typography>
          </Box>

          <ScoreRow label="Form Score" value={data.formScore} />
          <ScoreRow label="H2H Score" value={data.h2hScore} />

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Chip
              size="small"
              color={getScoreTone(data.formScore)}
              variant="outlined"
              label={`Form: ${data.formScore}%`}
            />
            <Chip
              size="small"
              color={getScoreTone(data.h2hScore)}
              variant="outlined"
              label={`H2H: ${data.h2hScore}%`}
            />
            <Chip
              size="small"
              color="primary"
              label={getPerformanceVerdict(data.formScore, data.h2hScore)}
            />
          </Stack>

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Star Player
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {data.starPlayerName}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
              Metric Score: {data.starPlayerMetricScore}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(100, data.starPlayerMetricScore))}
              sx={{ mt: 1, height: 8, borderRadius: 999 }}
            />
            <Typography variant="body2" color="text.secondary">
              Match Rating: {getMatchRating(data.starPlayerMetricScore)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {data.starPlayerSummary || 'Top performance contribution from recent match data.'}
            </Typography>
            {data.starPlayerId ? (
              <Button
                component={RouterLink}
                to={`/coach/teams?playerId=${encodeURIComponent(data.starPlayerId)}`}
                size="small"
                variant="text"
                sx={{ mt: 1, px: 0 }}
              >
                View Detailed Performance
              </Button>
            ) : null}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
