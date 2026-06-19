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
import { ErrorState, LoadingState } from '../../components/States'
import { useProfile } from '../../hooks/useSuperAdmin'
import { extractErrorMessage } from '../../api/apiClient'
import { roleToName, formatDateTime } from '../../utils/format'

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

export function ProfilePage() {
  const { data, isLoading, isError, error, refetch } = useProfile()

  if (isLoading) {
    return <LoadingState label="Loading profile…" />
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title="Profile" />
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      </>
    )
  }

  const initials = `${data.firstName?.[0] ?? ''}${data.lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <>
      <PageHeader title="Profile" description="Your Super Admin account details." />

      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
            <Avatar
              src={data.profilePhotoUrl ?? undefined}
              sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24 }}
            >
              {initials}
            </Avatar>
            <div>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {data.firstName} {data.lastName}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center' }}>
                <Chip size="small" label={roleToName(data.role)} />
                <Chip
                  size="small"
                  label={data.isActive ? 'Active' : 'Inactive'}
                  color={data.isActive ? 'success' : 'default'}
                  variant="outlined"
                />
              </Stack>
            </div>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Field label="Email" value={data.email} />
            <Field label="Phone" value={data.phone} />
            <Field label="Last Login" value={formatDateTime(data.lastLoginAt)} />
            <Field
              label="Tenant"
              value={data.tenantId ?? 'Platform (no tenant)'}
            />
          </Grid>
        </CardContent>
      </Card>
    </>
  )
}
