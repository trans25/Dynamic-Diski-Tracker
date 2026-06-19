import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link as RouterLink } from 'react-router-dom'
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
  Typography
   
} from '@mui/material'
import { AuthLayout } from './AuthLayout'
import { authService } from '../../api/services/authService'
import { useNotify } from '../../components/NotificationProvider'
import { extractErrorMessage } from '../../api/apiClient'
import { AppLoaderOverlay } from '../../components/States'

const schema = z.object({
  email: z.string().min(1, 'Please enter your email.').email('Enter a valid email.'),
})

type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const notify = useNotify()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await authService.forgotPassword(values)
      if (result?.resetToken) {
        // The API returns the reset token directly when no email provider is set up.
        notify(`Reset token generated: ${result.resetToken}`, 'success')
      } else {
        notify(
          'If an account with that email exists, a reset link has been sent.',
          'success'
        )
      }
    } catch (error) {
      notify(extractErrorMessage(error), 'error')
    }
  }

  return (
    <AuthLayout>
      <AppLoaderOverlay open={isSubmitting} label="Preparing password reset…" />
      <Card>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Forgot Password
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Enter your registered email and we'll send you a link to reset
              your password.
            </Typography>
          }
        />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Email"
                placeholder="name@example.com"
                fullWidth
                autoComplete="email"
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                {...register('email')}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : undefined
                }
              >
                Continue
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Remember your password?{' '}
                <Link component={RouterLink} to="/sign-in" underline="hover">
                  Sign In
                </Link>
              </Typography>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
