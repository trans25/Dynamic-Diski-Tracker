import {
  Avatar,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState } from '../../components/States'
import { useAuth } from '../../auth/AuthContext'
import { roleToName } from '../../utils/format'

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value || '—'}</Typography>
    </Grid>
  )
}

export function CoachProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <>
        <PageHeader title="Profile" />
        <EmptyState title="Not signed in" />
      </>
    )
  }

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <>
      <PageHeader title="Profile" description="Your coaching account details." />

      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
            <Avatar
              src={user.profilePhotoUrl ?? undefined}
              sx={{ width: 64, height: 64, bgcolor: 'secondary.main', fontSize: 24 }}
            >
              {initials}
            </Avatar>
            <div>
              <Typography variant="h6">
                {user.firstName} {user.lastName}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                <Chip size="small" label={roleToName(user.role)} />
                <Chip
                  size="small"
                  color={user.isActive ? 'success' : 'default'}
                  variant="outlined"
                  label={user.isActive ? 'Active' : 'Inactive'}
                />
              </Stack>
            </div>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2.5}>
            <Field label="Email" value={user.email} />
            <Field label="Phone" value={user.phone} />
            <Field label="Qualification" value={user.qualification} />
            <Field
              label="Experience"
              value={
                user.experienceYears != null
                  ? `${user.experienceYears} year(s)`
                  : null
              }
            />
            <Field label="Coaching license" value={user.coachingLicense} />
            <Field
              label="Specializations"
              value={user.sportSpecializations?.join(', ') ?? null}
            />
          </Grid>
        </CardContent>
      </Card>
    </>
  )
}
