import {
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningIcon from '@mui/icons-material/Warning'
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { useHealth } from '../../hooks/useHealth'
import { extractErrorMessage } from '../../api/apiClient'
import { formatDateTime } from '../../utils/format'

function statusColor(status: string): 'success' | 'warning' | 'error' | 'default' {
  const s = status.toLowerCase()
  if (s.includes('healthy') || s.includes('up') || s.includes('ok')) return 'success'
  if (s.includes('degraded') || s.includes('warn')) return 'warning'
  if (s.includes('unhealthy') || s.includes('down') || s.includes('error')) return 'error'
  return 'default'
}

function StatusIcon({ status }: { status: string }) {
  const color = statusColor(status)
  if (color === 'success') return <CheckCircleIcon color="success" />
  if (color === 'warning') return <WarningIcon color="warning" />
  if (color === 'error') return <ErrorIcon color="error" />
  return <CheckCircleIcon color="disabled" />
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (d) parts.push(`${d}d`)
  if (h) parts.push(`${h}h`)
  parts.push(`${m}m`)
  return parts.join(' ')
}

export function HealthPage() {
  const { data, isLoading, isError, error, refetch } = useHealth()

  if (isLoading) {
    return <LoadingState label="Loading system health…" />
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title="System Health" />
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="System Health"
        description="Live status of platform components."
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <StatusIcon status={data.status} />
                <div>
                  <Typography variant="body2" color="text.secondary">
                    Overall Status
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {data.status}
                  </Typography>
                </div>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Uptime
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {formatUptime(data.uptimeSeconds)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Last Checked
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatDateTime(data.checkedAt)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Component Checks
              </Typography>
              <List>
                {data.checks.map((check) => (
                  <ListItem
                    key={check.component}
                    secondaryAction={
                      <Chip
                        size="small"
                        label={check.status}
                        color={statusColor(check.status)}
                      />
                    }
                    divider
                  >
                    <ListItemText
                      primary={check.component}
                      secondary={check.description}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}
