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
  Typography,
} from '@mui/material'
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from '@mui/x-data-grid'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { useUsers, useUserMutations } from '../../hooks/useUsers'
import { useTenants } from '../../hooks/useTenants'
import { useNotify } from '../../components/NotificationProvider'
import { extractErrorMessage } from '../../api/apiClient'
import { roleToName, formatDateTime } from '../../utils/format'
import { UserRole, userRoleNames, type UserViewModel } from '../../api/types'
import { authService } from '../../api/services/authService'

function isHighLevelUser(role: number | string): boolean {
  const roleName = roleToName(role)
  return (
    roleName === UserRole.SuperAdmin ||
    roleName === UserRole.SchoolAdmin ||
    roleName === UserRole.Coach
  )
}

const highLevelRoles = [UserRole.SchoolAdmin, UserRole.Coach]

const highLevelRoleOptions = highLevelRoles.map((roleName) => ({
  label: roleName,
  value: userRoleNames.indexOf(roleName),
}))

type CreateUserFormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  tenantId: string
  role: number
}

const defaultCreateUserForm: CreateUserFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  tenantId: '',
  role: userRoleNames.indexOf(UserRole.Coach),
}

export function UsersPage() {
  const [tenantFilter, setTenantFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const { data, isLoading, isError, error, refetch } = useUsers(
    tenantFilter || undefined
  )
  const { data: tenants } = useTenants()
  const { assignRole, enable, disable } = useUserMutations()
  const notify = useNotify()
  const [createOpen, setCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState<CreateUserFormState>(defaultCreateUserForm)

  const visibleUsers = useMemo(
    () =>
      (data ?? []).filter((user) => {
        if (!isHighLevelUser(user.role)) return false
        const roleName = roleToName(user.role)
        const search = searchQuery.trim().toLowerCase()
        const matchesSearch =
          search.length === 0 ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(search) ||
          (user.email ?? '').toLowerCase().includes(search) ||
          roleName.toLowerCase().includes(search)
        const matchesRole = roleFilter === 'all' || roleName === roleFilter
        return matchesSearch && matchesRole
      }),
    [data, roleFilter, searchQuery],
  )

  const [roleTarget, setRoleTarget] = useState<UserViewModel | null>(null)
  const [selectedRole, setSelectedRole] = useState<number>(0)

  const openRoleDialog = (user: UserViewModel) => {
    setRoleTarget(user)
    const nextRole = typeof user.role === 'number' ? user.role : userRoleNames.indexOf(UserRole.Coach)
    setSelectedRole(highLevelRoleOptions.some((option) => option.value === nextRole) ? nextRole : userRoleNames.indexOf(UserRole.Coach))
  }

  const openCreateDialog = () => {
    setCreateForm({
      ...defaultCreateUserForm,
      tenantId: tenantFilter || tenants?.[0]?.id || '',
    })
    setCreateOpen(true)
  }

  const closeCreateDialog = () => {
    if (isCreating) return
    setCreateOpen(false)
    setCreateForm(defaultCreateUserForm)
  }

  const handleCreateUser = async () => {
    if (!createForm.firstName.trim() || !createForm.lastName.trim() || !createForm.email.trim() || !createForm.password.trim() || !createForm.tenantId) {
      notify('Complete all required user fields.', 'warning')
      return
    }

    try {
      setIsCreating(true)
      await authService.registerWithOutcome({
        email: createForm.email.trim(),
        password: createForm.password,
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        role: createForm.role,
        phone: createForm.phone.trim() || null,
        tenantId: createForm.tenantId,
        clubName: null,
        requestedSportTemplateId: null,
      })
      notify('User created successfully.', 'success')
      setCreateOpen(false)
      setCreateForm(defaultCreateUserForm)
      refetch()
    } catch (err) {
      notify(extractErrorMessage(err, 'Could not create user.'), 'error')
    } finally {
      setIsCreating(false)
    }
  }

  const handleAssignRole = async () => {
    if (!roleTarget) return
    try {
      await assignRole.mutateAsync({
        userId: roleTarget.id,
        role: selectedRole,
      })
      notify('Role assigned.', 'success')
      setRoleTarget(null)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleToggleActive = async (user: UserViewModel) => {
    try {
      if (user.isActive) {
        await disable.mutateAsync(user.id)
        notify('User disabled.', 'success')
      } else {
        await enable.mutateAsync(user.id)
        notify('User enabled.', 'success')
      }
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const columns = useMemo<GridColDef<UserViewModel>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
        minWidth: 160,
        valueGetter: (_value, row) => `${row.firstName} ${row.lastName}`.trim(),
      },
      { field: 'email', headerName: 'Email', flex: 1, minWidth: 200, valueGetter: (v) => v || '—' },
      {
        field: 'role',
        headerName: 'Role',
        width: 130,
        renderCell: (params: GridRenderCellParams<UserViewModel>) => (
          <Chip size="small" label={roleToName(params.row.role)} variant="outlined" />
        ),
      },
      {
        field: 'isActive',
        headerName: 'Status',
        width: 110,
        renderCell: (params: GridRenderCellParams<UserViewModel>) => (
          <Chip
            size="small"
            label={params.row.isActive ? 'Active' : 'Disabled'}
            color={params.row.isActive ? 'success' : 'default'}
            variant={params.row.isActive ? 'filled' : 'outlined'}
          />
        ),
      },
      {
        field: 'lastLoginAt',
        headerName: 'Last Login',
        width: 180,
        valueGetter: (value) => formatDateTime(value as string),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 130,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<UserViewModel>) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Assign role">
              <IconButton size="small" onClick={() => openRoleDialog(params.row)}>
                <ManageAccountsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={params.row.isActive ? 'Disable' : 'Enable'}>
              <IconButton
                size="small"
                color={params.row.isActive ? 'error' : 'success'}
                onClick={() => handleToggleActive(params.row)}
              >
                {params.row.isActive ? (
                  <BlockIcon fontSize="small" />
                ) : (
                  <CheckCircleIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage high-level platform users such as coaches and admins."
        action={
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, email, or role"
              sx={{ minWidth: 220 }}
            />
            <TextField
              select
              size="small"
              label="Filter by tenant"
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">All tenants</MenuItem>
              {(tenants ?? []).map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="all">All roles</MenuItem>
              <MenuItem value={UserRole.SuperAdmin}>Super Admin</MenuItem>
              <MenuItem value={UserRole.SchoolAdmin}>School Admin</MenuItem>
              <MenuItem value={UserRole.Coach}>Coach</MenuItem>
            </TextField>
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openCreateDialog}>
              Create User
            </Button>
          </Stack>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading users…" />
      ) : isError ? (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      ) : (
        <Card>
          <Box sx={{ width: '100%' }}>
            <DataGrid
              autoHeight
              rows={visibleUsers}
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
            <Box sx={{ px: 2, pb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Supported admin actions with current API: create high-level users, assign roles, and activate/deactivate access.
              </Typography>
            </Box>
        </Card>
      )}

        <Dialog open={createOpen} onClose={closeCreateDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Create High-Level User</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, firstName: e.target.value }))}
                />
                <TextField
                  label="Last Name"
                  fullWidth
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, lastName: e.target.value }))}
                />
              </Stack>
              <TextField
                label="Email"
                fullWidth
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Phone"
                  fullWidth
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
                <TextField
                  label="Temporary Password"
                  type="password"
                  fullWidth
                  value={createForm.password}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                />
              </Stack>
              <TextField
                select
                label="Tenant"
                fullWidth
                value={createForm.tenantId}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, tenantId: e.target.value }))}
              >
                {(tenants ?? []).map((tenant) => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Role"
                fullWidth
                value={createForm.role}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, role: Number(e.target.value) }))}
              >
                {highLevelRoleOptions.map((option) => (
                  <MenuItem key={option.label} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeCreateDialog} color="inherit" disabled={isCreating}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCreateUser} disabled={isCreating}>
              Create
            </Button>
          </DialogActions>
        </Dialog>

      <Dialog
        open={Boolean(roleTarget)}
        onClose={() => setRoleTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Assign Role</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Role"
            fullWidth
            value={selectedRole}
            onChange={(e) => setSelectedRole(Number(e.target.value))}
            sx={{ mt: 1 }}
          >
            {highLevelRoleOptions.map((option) => (
              <MenuItem key={option.label} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRoleTarget(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignRole}
            disabled={assignRole.isPending}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
