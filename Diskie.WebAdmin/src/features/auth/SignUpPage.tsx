import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { AuthLayout } from './AuthLayout'
import { useNotify } from '../../components/NotificationProvider'
import { extractErrorMessage } from '../../api/apiClient'
import { AppLoaderOverlay } from '../../components/States'
import { userRoleNames, UserRole } from '../../api/types'
import { authService } from '../../api/services/authService'
import { useQuery } from '@tanstack/react-query'

const schema = z
  .object({
    firstName: z.string().min(1, 'Please enter your first name.'),
    lastName: z.string().min(1, 'Please enter your last name.'),
    email: z.string().min(1, 'Please enter your email.').email('Enter a valid email.'),
    phone: z.string().optional(),
    password: z
      .string()
      .min(1, 'Please enter your password.')
      .min(8, 'Password must be at least 8 characters long.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
    clubName: z.string().min(1, 'Please enter your club or school name.'),
    requestedSportTemplateId: z.string().min(1, 'Please select a sport template.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function SignUpPage() {
  const navigate = useNavigate()
  const notify = useNotify()
  const [showPassword, setShowPassword] = useState(false)
  const publicSignupRole = Math.max(
    0,
    userRoleNames.indexOf(UserRole.SchoolAdmin)
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      clubName: '',
      requestedSportTemplateId: '',
    },
  })

  const templatesQuery = useQuery({
    queryKey: ['signup', 'sport-templates'],
    queryFn: () => authService.getSignupSportTemplates(),
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const outcome = await authService.registerWithOutcome({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        role: publicSignupRole,
        phone: values.phone || null,
        clubName: values.clubName,
        requestedSportTemplateId: values.requestedSportTemplateId,
      })
      notify('Account created successfully.', 'success')
      navigate(`/sign-up/success?step=${outcome.nextStep}`, {
        replace: true,
        state: {
          nextStep: outcome.nextStep,
          message: outcome.message,
        },
      })
    } catch (error) {
      notify(extractErrorMessage(error, 'Could not create account'), 'error')
    }
  }

  return (
    <AuthLayout>
      <AppLoaderOverlay open={isSubmitting} label="Creating your account…" />
      <Card>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Create your organization account
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Enter your details to set up a new Diski Tracker Hub workspace.
            </Typography>
          }
        />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/sign-in')}
              >
                Already have an account? Sign In
              </Button>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="First Name"
                  fullWidth
                  error={Boolean(errors.firstName)}
                  helperText={errors.firstName?.message}
                  {...register('firstName')}
                />
                <TextField
                  label="Last Name"
                  fullWidth
                  error={Boolean(errors.lastName)}
                  helperText={errors.lastName?.message}
                  {...register('lastName')}
                />
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
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Phone (optional)"
                  fullWidth
                  error={Boolean(errors.phone)}
                  helperText={errors.phone?.message}
                  {...register('phone')}
                />
              </Stack>
              <TextField
                label="Club / School"
                fullWidth
                error={Boolean(errors.clubName)}
                helperText={errors.clubName?.message}
                {...register('clubName')}
              />
              <TextField
                label="What sport does your club play?"
                select
                fullWidth
                error={Boolean(errors.requestedSportTemplateId)}
                helperText={
                  errors.requestedSportTemplateId?.message ??
                  (templatesQuery.isLoading
                    ? 'Loading sport templates...'
                    : 'Select the template your club wants to use.')
                }
                {...register('requestedSportTemplateId')}
              >
                {(templatesQuery.data ?? []).map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.displayName}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Password"
                placeholder="********"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                autoComplete="new-password"
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
              <TextField
                label="Confirm Password"
                placeholder="********"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                autoComplete="new-password"
                error={Boolean(errors.confirmPassword)}
                helperText={errors.confirmPassword?.message}
                {...register('confirmPassword')}
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
                    <PersonAddIcon />
                  )
                }
              >
                Create Account
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: 'center' }}
              >
                By creating an account, you agree to our Terms of Service and
                Privacy Policy.
              </Typography>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
