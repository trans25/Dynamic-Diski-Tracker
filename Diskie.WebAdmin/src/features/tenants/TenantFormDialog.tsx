import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import type { TenantViewModel } from '../../api/types'

const schema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Enter a valid email.').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  province: z.string().optional().or(z.literal('')),
  logoUrl: z.string().url('Enter a valid URL.').optional().or(z.literal('')),
  isActive: z.boolean(),
})

export type TenantFormValues = z.infer<typeof schema>

type TenantFormDialogProps = {
  open: boolean
  tenant?: TenantViewModel | null
  submitting?: boolean
  onClose: () => void
  onSubmit: (values: TenantFormValues) => void
}

const emptyValues: TenantFormValues = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  province: '',
  logoUrl: '',
  isActive: true,
}

export function TenantFormDialog({
  open,
  tenant,
  submitting,
  onClose,
  onSubmit,
}: TenantFormDialogProps) {
  const isEdit = Boolean(tenant)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset(
        tenant
          ? {
              name: tenant.name ?? '',
              email: tenant.email ?? '',
              phone: tenant.phone ?? '',
              address: tenant.address ?? '',
              city: tenant.city ?? '',
              province: tenant.province ?? '',
              logoUrl: tenant.logoUrl ?? '',
              isActive: tenant.isActive,
            }
          : emptyValues
      )
    }
  }, [open, tenant, reset])

  const isActive = watch('isActive')

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>{isEdit ? 'Edit Tenant' : 'Create Tenant'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              fullWidth
              required
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              {...register('name')}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Email"
                fullWidth
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                {...register('email')}
              />
              <TextField
                label="Phone"
                fullWidth
                error={Boolean(errors.phone)}
                helperText={errors.phone?.message}
                {...register('phone')}
              />
            </Stack>
            <TextField
              label="Address"
              fullWidth
              error={Boolean(errors.address)}
              helperText={errors.address?.message}
              {...register('address')}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="City"
                fullWidth
                error={Boolean(errors.city)}
                helperText={errors.city?.message}
                {...register('city')}
              />
              <TextField
                label="Province"
                fullWidth
                error={Boolean(errors.province)}
                helperText={errors.province?.message}
                {...register('province')}
              />
            </Stack>
            <TextField
              label="Logo URL"
              fullWidth
              error={Boolean(errors.logoUrl)}
              helperText={errors.logoUrl?.message}
              {...register('logoUrl')}
            />
            {isEdit && (
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => setValue('isActive', e.target.checked)}
                  />
                }
                label="Active"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {isEdit ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
