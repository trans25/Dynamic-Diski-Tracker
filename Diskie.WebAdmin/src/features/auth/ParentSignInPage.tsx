import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import { AuthLayout } from './AuthLayout'
import { useNotify } from '../../components/NotificationProvider'
import { extractErrorMessage, isForbiddenError } from '../../api/apiClient'
import { authService } from '../../api/services/authService'
import { AppLoaderOverlay } from '../../components/States'
import { AxiosError } from 'axios'

const schema = z.object({
  identificationNumber: z
    .string()
    .min(5, 'Enter a valid child ID number.')
    .max(32, 'Identification number is too long.'),
})

type FormValues = z.infer<typeof schema>

export function ParentSignInPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const notify = useNotify()
  const [magicLink, setMagicLink] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('reason') === 'session-expired') {
      notify('Your parent session expired. Please request a new magic link.', 'warning')
      navigate('/parent/sign-in', { replace: true })
      return
    }

    if (params.get('reason') === 'access-denied') {
      notify('You do not have permission to access that page.', 'warning')
      navigate('/parent/sign-in', { replace: true })
    }
  }, [location.search, navigate, notify])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identificationNumber: '' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await authService.requestParentMagicLink({
        childIdNumber: values.identificationNumber.trim(),
      })
      setMagicLink(result.magicLink ?? null)
      notify('Identification number found. Access link generated.', 'success')
    } catch (error) {
      const status = error instanceof AxiosError ? error.response?.status : undefined
      if (status === 404 || status === 400 || isForbiddenError(error)) {
        notify('Identification number not found. Please check it and try again.', 'warning')
        return
      }
      notify(extractErrorMessage(error, 'Could not verify identification number'), 'error')
    }
  }

  return (
    <AuthLayout>
      <AppLoaderOverlay open={isSubmitting} label="Generating your magic link…" />
      <Card>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Player / Guardian Access
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Enter your identification number to verify account existence.
              Use South African ID when available, otherwise use your registered passport or foreign ID number.
            </Typography>
          }
        />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Identification Number"
                placeholder="e.g. 9001011234088"
                fullWidth
                error={Boolean(errors.identificationNumber)}
                helperText={errors.identificationNumber?.message}
                {...register('identificationNumber')}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <LoginIcon />
                  )
                }
              >
                Verify & Continue
              </Button>

              {magicLink ? (
                <Typography variant="body2" color="text.secondary">
                  Local magic link: <Link href={magicLink}>{magicLink}</Link>
                </Typography>
              ) : null}

              <Typography variant="caption" color="text.secondary">
                Staff user?{' '}
                <Link component={RouterLink} to="/sign-in" underline="hover">
                  Use staff sign in
                </Link>
              </Typography>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
