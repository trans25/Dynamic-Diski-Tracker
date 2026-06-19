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
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import {
  TemplateFormDialog,
  type TemplateFormValues,
} from './TemplateFormDialog'
import { useTemplates, useTemplateMutations } from '../../hooks/useTemplates'
import { useNotify } from '../../components/NotificationProvider'
import { extractErrorMessage } from '../../api/apiClient'
import { formatDate } from '../../utils/format'
import type { SportTemplateViewModel } from '../../api/types'

function parsePositions(value?: string): string[] | null {
  if (!value) return null
  const parts = value
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length ? parts : null
}

export function TemplatesPage() {
  const { data, isLoading, isError, error, refetch } = useTemplates()
  const { create, update, remove } = useTemplateMutations()
  const notify = useNotify()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SportTemplateViewModel | null>(null)
  const [deleteTarget, setDeleteTarget] =
    useState<SportTemplateViewModel | null>(null)

  const handleCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const handleEdit = (template: SportTemplateViewModel) => {
    setEditing(template)
    setFormOpen(true)
  }

  const handleSubmit = async (values: TemplateFormValues) => {
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          name: values.name,
          displayName: values.displayName,
          icon: values.icon || null,
          description: values.description || null,
          positionOptions: parsePositions(values.positionOptions),
          defaultSeasonWeeks: values.defaultSeasonWeeks || null,
          isActive: values.isActive,
          // Preserve existing nested metric definitions on edit.
          assessmentMetrics: editing.assessmentMetrics ?? [],
          matchStatsFields: editing.matchStatsFields ?? [],
        })
        notify('Template updated.', 'success')
      } else {
        await create.mutateAsync({
          name: values.name,
          displayName: values.displayName,
          icon: values.icon || null,
          description: values.description || null,
          positionOptions: parsePositions(values.positionOptions),
          defaultSeasonWeeks: values.defaultSeasonWeeks || null,
          assessmentMetrics: [],
          matchStatsFields: [],
        })
        notify('Template created.', 'success')
      }
      setFormOpen(false)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await remove.mutateAsync(deleteTarget.id)
      notify('Template deleted.', 'success')
      setDeleteTarget(null)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const columns = useMemo<GridColDef<SportTemplateViewModel>[]>(
    () => [
      { field: 'displayName', headerName: 'Display Name', flex: 1, minWidth: 160 },
      { field: 'name', headerName: 'Key', width: 130 },
      {
        field: 'defaultSeasonWeeks',
        headerName: 'Season Weeks',
        width: 130,
        valueGetter: (v) => v ?? '—',
      },
      {
        field: 'assessmentMetrics',
        headerName: 'Metrics',
        width: 110,
        valueGetter: (_v, row) => row.assessmentMetrics?.length ?? 0,
      },
      {
        field: 'isActive',
        headerName: 'Status',
        width: 110,
        renderCell: (params: GridRenderCellParams<SportTemplateViewModel>) => (
          <Chip
            size="small"
            label={params.row.isActive ? 'Active' : 'Inactive'}
            color={params.row.isActive ? 'success' : 'default'}
            variant={params.row.isActive ? 'filled' : 'outlined'}
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
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<SportTemplateViewModel>) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => handleEdit(params.row)}>
                <EditIcon fontSize="small" />
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

  const visibleTemplates = useMemo(
    () =>
      (data ?? []).filter((template) => {
        const search = searchQuery.trim().toLowerCase()
        const matchesSearch =
          search.length === 0 ||
          template.displayName.toLowerCase().includes(search) ||
          template.name.toLowerCase().includes(search) ||
          (template.sportType ?? '').toLowerCase().includes(search)
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && template.isActive) ||
          (statusFilter === 'inactive' && !template.isActive)
        return matchesSearch && matchesStatus
      }),
    [data, searchQuery, statusFilter],
  )

  return (
    <>
      <PageHeader
        title="Sport Templates"
        description="Define sport-specific assessment and match-stat templates."
        action={
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Template or sport"
              sx={{ minWidth: 220 }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              Add Template
            </Button>
          </Stack>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading templates…" />
      ) : isError ? (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      ) : (
        <Card>
          <Box sx={{ width: '100%' }}>
            <DataGrid
              autoHeight
              rows={visibleTemplates}
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

      <TemplateFormDialog
        open={formOpen}
        template={editing}
        submitting={create.isPending || update.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteTarget?.displayName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        submitting={remove.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  )
}
