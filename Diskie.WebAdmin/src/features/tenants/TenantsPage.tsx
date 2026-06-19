import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  Chip,
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
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PauseCircleIcon from '@mui/icons-material/PauseCircle'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { TenantFormDialog, type TenantFormValues } from './TenantFormDialog'
import { useTenants, useTenantMutations } from '../../hooks/useTenants'
import { useNotify } from '../../components/NotificationProvider'
import { extractErrorMessage } from '../../api/apiClient'
import { formatDate } from '../../utils/format'
import type { TenantViewModel } from '../../api/types'

export function TenantsPage() {
  const { data, isLoading, isError, error, refetch } = useTenants()
  const { create, update, remove, suspend, activate } = useTenantMutations()
  const notify = useNotify()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TenantViewModel | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TenantViewModel | null>(null)

  const handleCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const handleEdit = (tenant: TenantViewModel) => {
    setEditing(tenant)
    setFormOpen(true)
  }

  const handleSubmit = async (values: TenantFormValues) => {
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          name: values.name,
          email: values.email || null,
          phone: values.phone || null,
          address: values.address || null,
          city: values.city || null,
          province: values.province || null,
          logoUrl: values.logoUrl || null,
          isActive: values.isActive,
          isApproved: editing.isApproved,
        })
        notify('Tenant updated.', 'success')
      } else {
        await create.mutateAsync({
          name: values.name,
          email: values.email || null,
          phone: values.phone || null,
          address: values.address || null,
          city: values.city || null,
          province: values.province || null,
          logoUrl: values.logoUrl || null,
        })
        notify('Tenant created.', 'success')
      }
      setFormOpen(false)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleToggleActive = async (tenant: TenantViewModel) => {
    try {
      if (tenant.isActive) {
        await suspend.mutateAsync(tenant.id)
        notify('Tenant suspended.', 'success')
      } else {
        await activate.mutateAsync(tenant.id)
        notify('Tenant activated.', 'success')
      }
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await remove.mutateAsync(deleteTarget.id)
      notify('Tenant deleted.', 'success')
      setDeleteTarget(null)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const columns = useMemo<GridColDef<TenantViewModel>[]>(
    () => [
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
      { field: 'city', headerName: 'City', width: 130, valueGetter: (v) => v || '—' },
      { field: 'email', headerName: 'Email', flex: 1, minWidth: 180, valueGetter: (v) => v || '—' },
      { field: 'phone', headerName: 'Phone', width: 140, valueGetter: (v) => v || '—' },
      {
        field: 'isActive',
        headerName: 'Status',
        width: 120,
        renderCell: (params: GridRenderCellParams<TenantViewModel>) => (
          <Chip
            size="small"
            label={params.row.isActive ? 'Active' : 'Suspended'}
            color={params.row.isActive ? 'success' : 'default'}
            variant={params.row.isActive ? 'filled' : 'outlined'}
          />
        ),
      },
      {
        field: 'isApproved',
        headerName: 'Approval',
        width: 130,
        renderCell: (params: GridRenderCellParams<TenantViewModel>) => (
          <Chip
            size="small"
            label={params.row.isApproved ? 'Approved' : 'Pending'}
            color={params.row.isApproved ? 'primary' : 'warning'}
            variant={params.row.isApproved ? 'filled' : 'outlined'}
          />
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Created',
        width: 130,
        valueGetter: (value) => formatDate(value as string),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 160,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<TenantViewModel>) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => handleEdit(params.row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={params.row.isActive ? 'Suspend' : 'Activate'}>
              <IconButton
                size="small"
                onClick={() => handleToggleActive(params.row)}
              >
                {params.row.isActive ? (
                  <PauseCircleIcon fontSize="small" />
                ) : (
                  <PlayCircleIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => setDeleteTarget(params.row)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const visibleTenants = useMemo(
    () =>
      (data ?? []).filter((tenant) => {
        const search = searchQuery.trim().toLowerCase()
        const matchesSearch =
          search.length === 0 ||
          tenant.name.toLowerCase().includes(search) ||
          (tenant.email ?? '').toLowerCase().includes(search) ||
          (tenant.city ?? '').toLowerCase().includes(search)
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && tenant.isActive) ||
          (statusFilter === 'suspended' && !tenant.isActive) ||
          (statusFilter === 'pending' && !tenant.isApproved)
        return matchesSearch && matchesStatus
      }),
    [data, searchQuery, statusFilter],
  )

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Manage schools and organizations on the platform."
        action={
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, city, email"
              sx={{ minWidth: 220 }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended' | 'pending')}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="pending">Pending Approval</MenuItem>
            </TextField>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              Add Tenant
            </Button>
          </Stack>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading tenants…" />
      ) : isError ? (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      ) : (
        <Card>
          <Box sx={{ width: '100%' }}>
            <DataGrid
              autoHeight
              rows={visibleTenants}
              columns={columns}
              getRowId={(row) => row.id}
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

      <TenantFormDialog
        open={formOpen}
        tenant={editing}
        submitting={create.isPending || update.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Tenant"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        submitting={remove.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  )
}
