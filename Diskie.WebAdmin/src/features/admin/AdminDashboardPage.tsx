import { Button, Card, Chip, Stack, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ShieldIcon from '@mui/icons-material/Shield'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import { Link as RouterLink } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import {
  usePendingSportRequests,
  usePendingTenants,
  useTenantMutations,
} from '../../hooks/useTenants'
import { useNotify } from '../../components/NotificationProvider'
import { extractErrorMessage } from '../../api/apiClient'
import { formatDate } from '../../utils/format'

export function AdminDashboardPage() {
  const pendingQuery = usePendingTenants()
  const pendingSportsQuery = usePendingSportRequests()
  const { approve } = useTenantMutations()
  const notify = useNotify()

  const handleApprove = async (tenantId: string) => {
    try {
      await approve.mutateAsync(tenantId)
      notify('Club approved.', 'success')
    } catch (error) {
      notify(extractErrorMessage(error), 'error')
    }
  }

  if (pendingQuery.isLoading) {
    return <LoadingState label="Loading pending clubs…" />
  }

  if (pendingQuery.isError) {
    return <ErrorState message={extractErrorMessage(pendingQuery.error)} onRetry={pendingQuery.refetch} />
  }

  const pending = pendingQuery.data ?? []
  const pendingSportCount = pendingSportsQuery.data?.length ?? 0

  return (
    <>
      <PageHeader
        title="System Admin"
        description="Gatekeeper approval queue for new clubs joining the platform."
        action={<Chip icon={<ShieldIcon />} label="Protected Control Panel" color="primary" />}
      />

      <Card variant="outlined" sx={{ mb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2, justifyContent: 'space-between', alignItems: { md: 'center' } }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <PendingActionsIcon color="warning" />
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Pending Sport Requests ({pendingSportCount})
            </Typography>
          </Stack>
          <Button component={RouterLink} to="/admin/pending-requests" variant="outlined" size="small">
            Review Requests
          </Button>
        </Stack>
      </Card>

      {pending.length === 0 ? (
        <EmptyState title="No pending clubs" description="All clubs have been reviewed and approved." />
      ) : (
        <Stack spacing={2}>
          {pending.map((tenant) => (
            <Card key={tenant.id} variant="outlined">
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, p: 2.5 }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {tenant.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tenant.email || 'No email'}{tenant.city ? ` · ${tenant.city}` : ''}{tenant.province ? `, ${tenant.province}` : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Signed up {formatDate(tenant.createdAt)}
                  </Typography>
                </Stack>

                <Button
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => handleApprove(tenant.id)}
                  disabled={approve.isPending}
                >
                  Approve
                </Button>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </>
  )
}
