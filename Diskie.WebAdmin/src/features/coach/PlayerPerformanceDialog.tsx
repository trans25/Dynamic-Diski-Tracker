import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { ErrorState, LoadingState } from '../../components/States'
import { StatCard } from '../../components/StatCard'
import { PlayerSkillMatrix } from '../../components/PlayerSkillMatrix'
import { TrophyCabinet } from '../../components/TrophyCabinet'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import StarIcon from '@mui/icons-material/Star'
import HealingIcon from '@mui/icons-material/Healing'
import { usePlayerPerformance } from '../../hooks/useCoach'
import { usePlayerInjuries } from '../../hooks/useCoach'
import { extractErrorMessage } from '../../api/apiClient'
import { formatDate } from '../../utils/format'
import {
  injurySeverityToName,
  injuryStatusToName,
} from '../../utils/coachFormat'

type PlayerPerformanceDialogProps = {
  open: boolean
  playerId?: string
  onClose: () => void
}

export function PlayerPerformanceDialog({
  open,
  playerId,
  onClose,
}: PlayerPerformanceDialogProps) {
  const { data, isLoading, isError, error, refetch } =
    usePlayerPerformance(open ? playerId : undefined)
  const playerInjuriesQuery = usePlayerInjuries(open ? playerId : undefined)

  const activePlayerInjuries = (playerInjuriesQuery.data ?? []).filter((injury) => injury.status === 0)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 6 }}>
        Player Performance
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {isLoading && <LoadingState label="Loading performance…" />}
        {(isError || (!data && !isLoading)) && (
          <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
        )}
        {data && (
          <Stack spacing={3}>
            {activePlayerInjuries.length > 0 ? (
              <Alert severity="error">
                Active injury flag: {activePlayerInjuries[0].injuryType} · {activePlayerInjuries[0].bodyPart}
              </Alert>
            ) : null}
            <Box>
              <Typography variant="h6">
                {data.firstName} {data.lastName}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                {data.position && (
                  <Chip size="small" label={data.position} variant="outlined" />
                )}
                {data.jerseyNumber != null && (
                  <Chip
                    size="small"
                    label={`#${data.jerseyNumber}`}
                    variant="outlined"
                  />
                )}
                {data.hasActiveInjury && (
                  <Chip size="small" color="error" label="Injured" />
                )}
              </Stack>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <StatCard
                  title="Attendance"
                  value={`${data.attendanceRate}%`}
                  caption={`${data.sessionsAttended}/${data.totalSessions} sessions`}
                  icon={EventAvailableIcon}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <StatCard
                  title="Avg. Rating"
                  value={data.averageRating != null ? data.averageRating : '—'}
                  caption={`${data.assessmentCount} assessment(s)`}
                  icon={StarIcon}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <StatCard
                  title="Injuries"
                  value={data.injuryCount}
                  caption={data.hasActiveInjury ? 'Active injury' : 'None active'}
                  icon={HealingIcon}
                />
              </Grid>
            </Grid>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Attendance rate
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, data.attendanceRate)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Recent assessments
              </Typography>
              {data.recentAssessments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No assessments recorded.
                </Typography>
              ) : (
                <List dense disablePadding>
                  {data.recentAssessments.map((a) => (
                    <ListItem key={a.id} disableGutters>
                      <ListItemText
                        primary={a.freeText || 'Assessment'}
                        secondary={`${formatDate(a.assessmentDate)}${
                          a.overallRating != null
                            ? ` · Rating ${a.overallRating}/5`
                            : ''
                        }`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Recent injuries
              </Typography>
              {data.recentInjuries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No injuries recorded.
                </Typography>
              ) : (
                <List dense disablePadding>
                  {data.recentInjuries.map((i) => (
                    <ListItem key={i.id} disableGutters>
                      <ListItemText
                        primary={`${i.injuryType} · ${i.bodyPart}`}
                        secondary={`${formatDate(i.occurredAt)} · ${injurySeverityToName(
                          i.severity
                        )} · ${injuryStatusToName(i.status)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <PlayerSkillMatrix playerId={playerId} />
            <TrophyCabinet playerId={playerId} />
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}
