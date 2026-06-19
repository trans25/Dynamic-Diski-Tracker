import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  Alert,
  InputAdornment,
} from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import SendIcon from '@mui/icons-material/Send'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { AuthLayout } from './AuthLayout'
import { useNotify } from '../../components/NotificationProvider'
import { extractErrorMessage } from '../../api/apiClient'
import { authService } from '../../api/services/authService'
import { AppLoaderOverlay } from '../../components/States'
import { AxiosError } from 'axios'
import { useAuth } from '../../auth/AuthContext'
import { canAccessPath, resolveRoleHomePath, resolveRoleName } from '../../auth/RoleRoute'
import { getRoleClaim } from '../../auth/tokenClaims'

const requestCodeSchema = z.object({
  contactMethod: z.enum(['phone', 'email']),
  contact: z
    .string()
    .min(5, 'Please enter a valid phone number or email.')
    .max(120, 'Contact information is too long.'),
}).superRefine((values, ctx) => {
  const raw = values.contact.trim()
  if (values.contactMethod === 'email') {
    const emailOk = z.string().email().safeParse(raw).success
    if (!emailOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid email address.',
        path: ['contact'],
      })
    }
    return
  }

  const normalized = raw.replace(/[\s()-]/g, '')
  const phoneOk = /^\+?[1-9]\d{7,14}$/.test(normalized)
  if (!phoneOk) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Enter a valid phone number in international or local format.',
      path: ['contact'],
    })
  }
})

const verifyCodeSchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, 'Enter the 6-digit code.'),
})

type RequestCodeFormValues = z.infer<typeof requestCodeSchema>
type VerifyCodeFormValues = z.infer<typeof verifyCodeSchema>

export function PlayerParentOTPSignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { applyTokenSession } = useAuth()
  const notify = useNotify()
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [contactInfo, setContactInfo] = useState<{ method: 'phone' | 'email'; value: string } | null>(null)
  const [codeExpiry, setCodeExpiry] = useState<number | null>(null)
  const [attemptsLeft, setAttemptsLeft] = useState<number>(5)
  const [resendCooldown, setResendCooldown] = useState<number>(0)

  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: errorsRequest, isSubmitting: isSubmittingRequest },
    watch: watchRequest,
  } = useForm<RequestCodeFormValues>({
    resolver: zodResolver(requestCodeSchema),
    defaultValues: { contactMethod: 'phone', contact: '' },
  })

  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    formState: { errors: errorsVerify, isSubmitting: isSubmittingVerify },
    reset: resetVerify,
  } = useForm<VerifyCodeFormValues>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: '' },
  })

  const contactMethod = watchRequest('contactMethod')

  useEffect(() => {
    if (codeExpiry === null) return
    const interval = setInterval(() => {
      setCodeExpiry((prev) => (prev === null || prev <= 0 ? null : prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [codeExpiry])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [resendCooldown])

  const onRequestCode = async (values: RequestCodeFormValues) => {
    try {
      const normalizedContact = values.contact.trim()
      const requestResult = await authService.requestPlayerParentOTP({
        contact: normalizedContact,
        method: values.contactMethod,
      })
      setContactInfo({
        method: values.contactMethod,
        value: normalizedContact,
      })
      setChallengeId(requestResult.challengeId ?? null)
      setCodeExpiry(requestResult.expiresIn ?? 300)
      setResendCooldown(requestResult.resendAfterSeconds ?? 30)
      setAttemptsLeft(requestResult.maxAttempts ?? 5)
      resetVerify()
      setStep('verify')
      notify('Code sent successfully. Check your phone or email.', 'success')
    } catch (error) {
      const status = error instanceof AxiosError ? error.response?.status : undefined
      if (status === 404 || status === 400) {
        notify('We could not find an account for that phone or email. Please check and try again.', 'warning')
        return
      }
      notify(extractErrorMessage(error, 'Could not send code'), 'error')
    }
  }

  const onVerifyCode = async (values: VerifyCodeFormValues) => {
    if (!contactInfo) return

    try {
      if (attemptsLeft <= 0) {
        notify('Too many attempts. Please request a new code.', 'error')
        handleBack()
        return
      }

      const result = await authService.verifyPlayerParentOTP({
        contact: contactInfo.value,
        method: contactInfo.method,
        code: values.code.trim(),
        challengeId: challengeId ?? undefined,
      })

      applyTokenSession(result.accessToken)
      const tokenRole = resolveRoleName(result.role ?? getRoleClaim(result.accessToken))
      const requested = (
        location.state as { from?: { pathname?: string } } | null
      )?.from?.pathname
      const fallback = resolveRoleHomePath(tokenRole)
      const target = requested && canAccessPath(tokenRole, requested) ? requested : fallback

      notify(`Welcome, ${result.childName || contactInfo.value}!`, 'success')
      navigate(target, { replace: true })
    } catch (error) {
      const status = error instanceof AxiosError ? error.response?.status : undefined
      if (status === 401 || status === 400) {
        const remaining = attemptsLeft - 1
        setAttemptsLeft(remaining)
        if (remaining <= 0) {
          notify('Too many failed attempts. Please request a new code.', 'error')
          handleBack()
          return
        }
        notify(`That code is incorrect. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`, 'warning')
        return
      }
      if (status === 410) {
        notify('That code expired. Please request a new code.', 'warning')
        handleBack()
        return
      }
      if (status === 429) {
        notify('Too many attempts. Please wait and request a new code.', 'warning')
        setResendCooldown(60)
        return
      }
      notify(extractErrorMessage(error, 'Could not verify code'), 'error')
    }
  }

  const handleBack = () => {
    setStep('request')
    setChallengeId(null)
    setContactInfo(null)
    setCodeExpiry(null)
    setResendCooldown(0)
    setAttemptsLeft(5)
    resetVerify()
  }

  const formatTimeRemaining = (seconds: number | null) => {
    if (seconds === null || seconds <= 0) return null
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <AuthLayout>
      <AppLoaderOverlay
        open={isSubmittingRequest || isSubmittingVerify}
        label={step === 'request' ? 'Sending code…' : 'Verifying code…'}
      />
      <Card>
        {step === 'request' ? (
          <>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Player / Guardian Access
                </Typography>
              }
              subheader={
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Enter your phone number or email to receive a one-time code.
                </Typography>
              }
            />
            <CardContent>
              <Box component="form" onSubmit={handleSubmitRequest(onRequestCode)} noValidate>
                <Stack spacing={2}>
                  <TextField
                    select
                    label="Contact Method"
                    fullWidth
                    defaultValue="phone"
                    slotProps={{
                      select: {
                        native: true,
                      },
                    }}
                    {...registerRequest('contactMethod')}
                  >
                    <option value="phone">Phone Number</option>
                    <option value="email">Email Address</option>
                  </TextField>

                  <TextField
                    label={contactMethod === 'phone' ? 'Phone Number' : 'Email Address'}
                    placeholder={contactMethod === 'phone' ? '+27 xx xxx xxxx' : 'your@email.com'}
                    fullWidth
                    error={Boolean(errorsRequest.contact)}
                    helperText={errorsRequest.contact?.message}
                    {...registerRequest('contact')}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmittingRequest}
                    startIcon={
                      isSubmittingRequest ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <SendIcon />
                      )
                    }
                  >
                    Send Code
                  </Button>

                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                    Staff user?{' '}
                    <Button
                      size="small"
                      color="primary"
                      sx={{ textTransform: 'none' }}
                      onClick={() => navigate('/sign-in')}
                    >
                      Use staff login
                    </Button>
                  </Typography>
                </Stack>
              </Box>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Enter Your Code
                </Typography>
              }
              subheader={
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Check your {contactInfo?.method === 'phone' ? 'phone' : 'email'} for the code we just sent.
                </Typography>
              }
            />
            <CardContent>
              <Box component="form" onSubmit={handleSubmitVerify(onVerifyCode)} noValidate>
                <Stack spacing={2}>
                  {codeExpiry !== null && codeExpiry > 0 && (
                    <Alert severity="info">
                      Code expires in: <strong>{formatTimeRemaining(codeExpiry)}</strong>
                    </Alert>
                  )}

                  {codeExpiry === null || codeExpiry <= 0 ? (
                    <Alert severity="warning">
                      Code expired. Please request a new code.
                    </Alert>
                  ) : null}

                  <TextField
                    label="One-Time Code"
                    placeholder="123456"
                    fullWidth
                    autoComplete="one-time-code"
                    disabled={codeExpiry === null || codeExpiry <= 0}
                    error={Boolean(errorsVerify.code)}
                    helperText={errorsVerify.code?.message}
                    slotProps={{
                      htmlInput: {
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        maxLength: 6,
                      },
                      input: {
                        endAdornment: attemptsLeft > 0 && (
                          <InputAdornment position="end">
                            <Typography variant="caption" color="text.secondary">
                              {attemptsLeft} left
                            </Typography>
                          </InputAdornment>
                        ),
                      },
                    }}
                    {...registerVerify('code')}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmittingVerify || codeExpiry === null || codeExpiry <= 0}
                    startIcon={
                      isSubmittingVerify ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <LoginIcon />
                      )
                    }
                  >
                    Verify & Sign In
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBack}
                    disabled={isSubmittingVerify}
                  >
                    Back
                  </Button>

                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                    Didn&apos;t receive the code?{' '}
                    <Button
                      size="small"
                      color="primary"
                      sx={{ textTransform: 'none' }}
                      onClick={() => {
                        if (resendCooldown > 0) return
                        handleBack()
                      }}
                      disabled={resendCooldown > 0}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Request another'}
                    </Button>
                  </Typography>
                </Stack>
              </Box>
            </CardContent>
          </>
        )}
      </Card>
    </AuthLayout>
  )
}
