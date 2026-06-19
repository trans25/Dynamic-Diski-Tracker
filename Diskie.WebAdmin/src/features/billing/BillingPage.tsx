import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material'
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { useBilling, useBillingMutations } from '../../hooks/useBilling'
import { useNotify } from '../../components/NotificationProvider'
import { extractErrorMessage } from '../../api/apiClient'
import { billingPlanToName, formatDate } from '../../utils/format'
import { billingPlanNames, type TenantBillingViewModel } from '../../api/types'

const planColor: Record<string, 'default' | 'info' | 'primary' | 'success'> = {
  Free: 'default',
  Starter: 'info',
  Pro: 'primary',
  Enterprise: 'success',
}

export function BillingPage() {
  const { data, isLoading, isError, error, refetch } = useBilling()
  const { assignPlan } = useBillingMutations()
  const notify = useNotify()
  const [searchQuery, setSearchQuery] = useState('')
  const [planFilter, setPlanFilter] = useState<'all' | string>('all')

  const [target, setTarget] = useState<TenantBillingViewModel | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<number>(0)

  const openDialog = (row: TenantBillingViewModel) => {
    setTarget(row)
    setSelectedPlan(typeof row.billingPlan === 'number' ? row.billingPlan : 0)
  }

  const handleAssign = async () => {
    if (!target) return
    try {
      await assignPlan.mutateAsync({
        tenantId: target.tenantId,
        billingPlan: selectedPlan,
      })
      notify('Billing plan assigned.', 'success')
      setTarget(null)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const columns = useMemo<GridColDef<TenantBillingViewModel>[]>(
    () => [
      { field: 'tenantName', headerName: 'Tenant', flex: 1, minWidth: 200 },
      {
        field: 'billingPlan',
        headerName: 'Plan',
        width: 160,
        renderCell: (params: GridRenderCellParams<TenantBillingViewModel>) => {
          const name = billingPlanToName(params.row.billingPlan)
          return <Chip size="small" label={name} color={planColor[name] ?? 'default'} />
        },
      },
      {
        field: 'billingPlanAssignedAt',
        headerName: 'Assigned',
        width: 150,
        valueGetter: (value) => formatDate(value as string),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 110,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<TenantBillingViewModel>) => (
          <Tooltip title="Change plan">
            <IconButton size="small" onClick={() => openDialog(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const visibleBillingRows = useMemo(
    () =>
      (data ?? []).filter((row) => {
        const planName = billingPlanToName(row.billingPlan)
        const search = searchQuery.trim().toLowerCase()
        const matchesSearch =
          search.length === 0 ||
          row.tenantName.toLowerCase().includes(search) ||
          planName.toLowerCase().includes(search)
        const matchesPlan = planFilter === 'all' || planName === planFilter
        return matchesSearch && matchesPlan
      }),
    [data, planFilter, searchQuery],
  )

  return (
    <>
      <PageHeader
        title="Billing"
        description="Manage billing plans assigned to each tenant."
        action={
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tenant or plan"
              sx={{ minWidth: 220 }}
            />
            <TextField
              select
              size="small"
              label="Plan"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All plans</MenuItem>
              {billingPlanNames.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading billing…" />
      ) : isError ? (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      ) : (
        <Card>
          <Box sx={{ width: '100%' }}>
            <DataGrid
              autoHeight
              rows={visibleBillingRows}
              columns={columns}
              getRowId={(row) => row.tenantId}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              disableRowSelectionOnClick
              sx={{ border: 'none' }}
            />
          </Box>
        </Card>
      )}

      <Dialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Assign Billing Plan</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Billing Plan"
            fullWidth
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(Number(e.target.value))}
            sx={{ mt: 1 }}
          >
            {billingPlanNames.map((name, value) => (
              <MenuItem key={name} value={value}>
                {name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTarget(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={assignPlan.isPending}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
