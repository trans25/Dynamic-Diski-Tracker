import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import {
  announcementAudienceNames,
} from '../../api/types'
import type {
  AnnouncementViewModel,
  CoachTeamViewModel,
} from '../../api/types'

const schema = z.object({
  teamId: z.string().optional(),
  title: z.string().min(1, 'Title is required.'),
  body: z.string().min(1, 'Message is required.'),
  audience: z.coerce.number().int().min(0),
  priority: z.coerce.number().int().min(0),
  channel: z.coerce.number().int().min(0),
})

export type AnnouncementFormValues = z.infer<typeof schema>

type AnnouncementDialogProps = {
  open: boolean
  teams: CoachTeamViewModel[]
  announcement?: AnnouncementViewModel | null
  submitting?: boolean
  onClose: () => void
  onSubmit: (values: AnnouncementFormValues) => void
}

export function AnnouncementDialog({
  open,
  teams,
  announcement,
  submitting,
  onClose,
  onSubmit,
}: AnnouncementDialogProps) {
  const isEdit = Boolean(announcement)

  const defaults = useMemo<z.input<typeof schema>>(
    () => ({
      teamId: announcement?.teamId ?? '',
      title: announcement?.title ?? '',
      body: announcement?.body ?? '',
      audience: announcement?.audience ?? 0,
      priority: announcement?.priority ?? 0,
      channel: announcement?.channel ?? 3,
    }),
    [announcement]
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, AnnouncementFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })

  useEffect(() => {
    if (open) {
      reset(defaults)
    }
  }, [open, reset, defaults])

  const audience = watch('audience')

  const audienceOptions = [
    { value: 0, label: 'All' },
    { value: 1, label: 'Players' },
    { value: 2, label: 'Guardians' },
  ]

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        {isEdit ? 'Edit Announcement' : 'New Announcement'}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box>
              <Box sx={{ mb: 1, fontSize: 13, color: 'text.secondary' }}>Send To</Box>
              <Stack direction="row" spacing={1}>
                {audienceOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={audience === option.value ? 'contained' : 'outlined'}
                    onClick={() => setValue('audience', option.value)}
                    sx={{ minWidth: 110 }}
                  >
                    {option.label}
                  </Button>
                ))}
              </Stack>
            </Box>

            <TextField
              label="Title"
              fullWidth
              error={Boolean(errors.title)}
              helperText={errors.title?.message}
              {...register('title')}
            />

            <TextField
              label="Message"
              fullWidth
              multiline
              minRows={4}
              error={Boolean(errors.body)}
              helperText={errors.body?.message}
              {...register('body')}
            />

            {teams.length === 0 ? null : (
              <Box sx={{ fontSize: 12, color: 'text.secondary' }}>
                Audience options: {announcementAudienceNames.join(', ')}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {isEdit ? 'Save Announcement' : 'Send Announcement'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
