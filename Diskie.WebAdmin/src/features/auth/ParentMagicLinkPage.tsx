import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, Stack, Typography } from '@mui/material'
import { AuthLayout } from './AuthLayout'
import { useNotify } from '../../components/NotificationProvider'
import { authService } from '../../api/services/authService'
import { extractErrorMessage } from '../../api/apiClient'
import { useAuth } from '../../auth/AuthContext'
import { AppLoaderOverlay } from '../../components/States'

export function ParentMagicLinkPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const notify = useNotify()
  const { applyTokenSession } = useAuth()
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search)
      const token = params.get('token')

      if (!token) {
        notify('Magic link token is missing.', 'error')
        navigate('/parent/sign-in', { replace: true })
        return
      }

      try {
        setIsVerifying(true)
        const result = await authService.consumeParentMagicToken({ token })
        applyTokenSession(result.accessToken)
        notify('Signed in as parent successfully.', 'success')
        navigate('/parent/portal', { replace: true })
      } catch (error) {
        notify(extractErrorMessage(error, 'Magic link is invalid or expired.'), 'error')
        navigate('/parent/sign-in', { replace: true })
      } finally {
        setIsVerifying(false)
      }
    }

    void run()
  }, [applyTokenSession, location.search, navigate, notify])

  return (
    <AuthLayout>
      <AppLoaderOverlay open={isVerifying} label="Verifying secure magic link…" />
      <Card>
        <CardContent>
          <Stack spacing={2} sx={{ alignItems: 'center', py: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Verifying Magic Link
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Please wait while we sign you into the restricted parent view.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
