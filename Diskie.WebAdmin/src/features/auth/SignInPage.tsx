import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { AuthLayout } from './AuthLayout'
import { useAuth } from '../../auth/AuthContext'
import { canAccessPath, resolveRoleHomePath } from '../../auth/RoleRoute'
import { useNotify } from '../../components/NotificationProvider'
import { extractErrorMessage } from '../../api/apiClient'
import { AppLoaderOverlay } from '../../components/States'

const schema = z.object({
  email: z.string().min(1, 'Please enter your email.').email('Enter a valid email.'),
  password: z
    .string()
    .min(1, 'Please enter your password.')
    .min(8, 'Password must be at least 8 characters long.'),
})

type FormValues = z.infer<typeof schema>

export function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const notify = useNotify()
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('reason') === 'session-expired') {
      notify('Your session expired. Please sign in again.', 'warning')
      navigate('/sign-in', { replace: true })
      return
    }

    if (params.get('reason') === 'access-denied') {
      notify('Your account does not have access to that area. Please sign in with a permitted account.', 'warning')
      navigate('/sign-in', { replace: true })
    }
  }, [location.search, navigate, notify])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await login(values)
      notify(`Welcome back, ${result.user.firstName || values.email}!`, 'success')
      const requested = (
        location.state as { from?: { pathname?: string } } | null
      )?.from?.pathname
      const fallback = resolveRoleHomePath(result.user.role)
      const target = requested && canAccessPath(result.user.role, requested)
        ? requested
        : fallback
      navigate(target, { replace: true })
    } catch (error) {
      notify(extractErrorMessage(error, 'Invalid credentials'), 'error')
    }
  }

  return (
    <AuthLayout>
      <AppLoaderOverlay open={isSubmitting} label="Signing you in securely…" />
      <Card>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Sign in to your workspace
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Enter your email and password to access Diski Tracker Hub.
            </Typography>
          }
        />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PersonAddIcon />}
                  onClick={() => navigate('/sign-up')}
                >
                  Create Account
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/player/sign-in')}
                >
                  Player / Guardian Access
                </Button>
              </Stack>
              <TextField
                label="Email"
                placeholder="name@example.com"
                fullWidth
                autoComplete="email"
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                {...register('email')}
              />
              <Box>
                <TextField
                  label="Password"
                  placeholder="********"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  autoComplete="current-password"
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((s) => !s)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  {...register('password')}
                />
                <Box sx={{ textAlign: 'right', mt: 0.5 }}>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => navigate('/forgot-password')}
                    sx={{ textTransform: 'none' }}
                  >
                    Forgot password?
                  </Button>
                </Box>
              </Box>
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
                Sign in
              </Button>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  OR CONTINUE WITH
                </Typography>
              </Divider>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: 'center' }}
              >
                By clicking sign in, you agree to our Terms of Service and
                Privacy Policy.
              </Typography>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
