import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import StarIcon from '@mui/icons-material/Star'
import { Card, CardContent, CardHeader, Grid, Typography } from '@mui/material'
import { usePlayerAchievements } from '../hooks/useCoach'
import { ErrorState, LoadingState } from './States'
import { extractErrorMessage, isForbiddenError } from '../api/apiClient'
import { formatDate } from '../utils/format'

type TrophyCabinetProps = {
  playerId?: string
}

function getIcon(iconKey: string) {
  switch (iconKey) {
    case 'sports_soccer':
      return <SportsSoccerIcon color="success" />
    case 'looks_10':
      return <EmojiEventsIcon color="primary" />
    default:
      return <StarIcon color="warning" />
  }
}

export function TrophyCabinet({ playerId }: TrophyCabinetProps) {
  const { data, isLoading, isError, error, refetch } = usePlayerAchievements(playerId)

  if (!playerId) {
    return null
  }

  if (isLoading) {
    return <LoadingState label="Loading achievements…" />
  }

  if (isError && !isForbiddenError(error)) {
    return <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
  }

  return (
    <Card variant="outlined">
      <CardHeader title="Trophy Cabinet" subheader="Milestones and achievement badges" />
      <CardContent>
        {!data || data.length === 0 || (isError && isForbiddenError(error)) ? (
          <Typography variant="body2" color="text.secondary">
            No achievements unlocked yet.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {data.map((achievement) => (
              <Grid key={achievement.id} size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    {getIcon(achievement.iconKey)}
                    <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 700 }}>
                      {achievement.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {achievement.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(achievement.awardedAt)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  )
}
