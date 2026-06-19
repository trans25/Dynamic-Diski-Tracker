import { Link as RouterLink, useLocation } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { AuthLayout } from './AuthLayout'
import type { RegisterNextStep } from '../../api/services/authService'

type SuccessState = {
  nextStep?: RegisterNextStep
  message?: string
}

function resolveStep(value: string | undefined): RegisterNextStep {
  if (value === 'verify-email' || value === 'approval') {
    return value
  }
  return 'signin'
}

export function SignUpSuccessPage() {
  const location = useLocation()
  const state = (location.state as SuccessState | null) ?? null
  const params = new URLSearchParams(location.search)
  const step = resolveStep(state?.nextStep ?? params.get('step') ?? undefined)

  const contentByStep: Record<
    RegisterNextStep,
    {
      title: string
      subheader: string
      helper: string
      cta: string
    }
  > = {
    signin: {
      title: 'Account created',
      subheader:
        'Your account was created successfully. Sign in to continue to the admin portal.',
      helper:
        'If your organization requires approval, your access may be limited until an administrator grants permissions.',
      cta: 'Continue to Sign in',
    },
    'verify-email': {
      title: 'Verify your email',
      subheader:
        'Your account was created. Check your email for a verification link before signing in.',
      helper:
        'Once your email is verified, return here and sign in with your credentials.',
      cta: 'Go to Sign in',
    },
    approval: {
      title: 'Pending approval',
      subheader:
        'Your account request was received and is awaiting administrator approval.',
      helper:
        'Your club sport request is now pending. An admin must approve it before you can sign in.',
      cta: 'Go to Sign in',
    },
  }

  const content = contentByStep[step]

  return (
    <AuthLayout>
      <Card>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {content.title}
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {content.subheader}
            </Typography>
          }
        />
        <CardContent>
          <Stack spacing={2}>
            <Button
              component={RouterLink}
              to="/sign-in"
              variant="contained"
              size="large"
              startIcon={<CheckCircleIcon />}
            >
              {content.cta}
            </Button>
            {state?.message ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {state.message}
              </Typography>
            ) : null}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: 'center' }}
            >
              {content.helper}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
