import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import type { SportTemplateViewModel } from '../../api/types'

const schema = z.object({
  sportTemplateId: z.string().min(1, 'Select a sport template.'),
  name: z.string().min(1, 'Team name is required.'),
  ageGroup: z.string().optional(),
  genderCategory: z.string().optional(),
  level: z.string().optional(),
})

export type CreateTeamFormValues = z.infer<typeof schema>

type CreateTeamDialogProps = {
  open: boolean
  templates: SportTemplateViewModel[]
  templatesLoading?: boolean
  submitting?: boolean
  onClose: () => void
  onSubmit: (values: CreateTeamFormValues) => void
}

export function CreateTeamDialog({
  open,
  templates,
  templatesLoading,
  submitting,
  onClose,
  onSubmit,
}: CreateTeamDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateTeamFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sportTemplateId: '',
      name: '',
      ageGroup: '',
      genderCategory: '',
      level: '',
    },
  })

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  const noTemplates = !templatesLoading && templates.length === 0

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Team</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          {noTemplates ? (
            <Typography variant="body2" color="text.secondary">
              No sport templates are available yet. Please ask your administrator
              to set one up before creating a team.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  control={control}
                  name="sportTemplateId"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Sport template"
                      fullWidth
                      autoFocus
                      disabled={templatesLoading}
                      error={Boolean(errors.sportTemplateId)}
                      helperText={
                        errors.sportTemplateId?.message ??
                        'Positions and assessments come from this template.'
                      }
                    >
                      {templates.map((template) => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.displayName}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Team name"
                  fullWidth
                  placeholder="e.g. U15 Boys"
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  {...register('name')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Age group"
                  fullWidth
                  placeholder="U15"
                  {...register('ageGroup')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Gender"
                  fullWidth
                  placeholder="Boys"
                  {...register('genderCategory')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Level"
                  fullWidth
                  placeholder="1st Team"
                  {...register('level')}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || noTemplates}
          >
            Create Team
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
