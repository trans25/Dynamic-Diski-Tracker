import { Button, Card, CardContent, Chip, Pagination, Stack, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { extractErrorMessage } from '../../api/apiClient'
import { usePendingSportRequests, useTenantMutations } from '../../hooks/useTenants'
import { useNotify } from '../../components/NotificationProvider'
import { formatDate } from '../../utils/format'

export function AdminPendingRequests() {
  const pendingQuery = usePendingSportRequests()
  const { approveSportRequest, rejectSportRequest } = useTenantMutations()
  const notify = useNotify()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 5
  const requests = pendingQuery.data ?? []

  const handleApprove = async (requestId: string) => {
    try {
      await approveSportRequest.mutateAsync(requestId)
      notify('Sport request approved.', 'success')
    } catch (error) {
      notify(extractErrorMessage(error), 'error')
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      await rejectSportRequest.mutateAsync(requestId)
      notify('Sport request rejected.', 'success')
    } catch (error) {
      notify(extractErrorMessage(error), 'error')
    }
  }

  const filteredRequests = useMemo(
    () =>
      requests.filter((request) => {
        const search = searchQuery.trim().toLowerCase()
        if (search.length === 0) return true
        return (
          (request.tenantName ?? '').toLowerCase().includes(search) ||
          (request.requestedSportTemplateName ?? '').toLowerCase().includes(search) ||
          (request.sportType ?? '').toLowerCase().includes(search) ||
          (request.city ?? '').toLowerCase().includes(search) ||
          (request.province ?? '').toLowerCase().includes(search)
        )
      }),
    [requests, searchQuery],
  )

  if (pendingQuery.isLoading) {
    return <LoadingState label="Loading pending sport requests..." />
  }

  if (pendingQuery.isError) {
    return <ErrorState message={extractErrorMessage(pendingQuery.error)} onRetry={pendingQuery.refetch} />
  }
  const pageCount = Math.max(1, Math.ceil(filteredRequests.length / pageSize))
  const pagedRequests = filteredRequests.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      <PageHeader
        title="Pending Sport Requests"
        description="Review and approve or reject club sport requests."
        action={
          <TextField
            size="small"
            label="Search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Club, sport, location"
            sx={{ minWidth: 240 }}
          />
        }
      />

      {filteredRequests.length === 0 ? (
        <EmptyState
          title="No pending requests"
          description="All pending club sport requests have been processed."
        />
      ) : (
        <Stack spacing={2}>
          {pagedRequests.map((request) => (
            <Card key={request.id} variant="outlined">
              <CardContent>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {request.tenantName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Requested {request.requestedSportTemplateName} ({request.sportType}) on {formatDate(request.requestedDate)}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip label={request.status} size="small" color="warning" />
                      {request.city || request.province ? (
                        <Chip label={`${request.city ?? ''}${request.city && request.province ? ', ' : ''}${request.province ?? ''}`} size="small" variant="outlined" />
                      ) : null}
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleApprove(request.id)}
                      disabled={approveSportRequest.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleReject(request.id)}
                      disabled={rejectSportRequest.isPending}
                    >
                      Reject
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Pagination count={pageCount} page={page} onChange={(_e, value) => setPage(value)} color="primary" />
          </Stack>
        </Stack>
      )}
    </>
  )
}