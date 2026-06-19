import { Box, Button, Stack, Typography } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { resolveRoleHomePath, resolveRoleName } from '../../auth/RoleRoute'

export function AccessDeniedPage() {
  const { logout, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const blockedPath = params.get('from')
  const roleName = resolveRoleName(user?.role)
  const roleHomePath = resolveRoleHomePath(user?.role)

  const handleStaffSignIn = () => {
    logout()
    navigate('/sign-in', { replace: true })
  }

  const handleParentSignIn = () => {
    logout()
    navigate('/parent/sign-in', { replace: true })
  }

  const handleGoHome = () => {
    navigate(roleHomePath, { replace: true })
  }

  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
      }}
    >
      <Stack spacing={1.5} sx={{ alignItems: 'center', maxWidth: 520 }}>
        <Typography variant="h2" color="text.secondary" sx={{ fontWeight: 800 }}>
          403
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Access restricted
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Your current account does not have permission to open this page. Use an account with the required role, or return to your authorized workspace.
        </Typography>
        {blockedPath ? (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>
            Blocked page: {blockedPath}
          </Typography>
        ) : null}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          {roleName ? (
            <Button onClick={handleGoHome} variant="contained">
              Go to my workspace
            </Button>
          ) : null}
          <Button onClick={handleStaffSignIn} variant={roleName ? 'outlined' : 'contained'}>
            Sign in with another account
          </Button>
          <Button onClick={handleParentSignIn} variant="outlined">
            Parent sign in
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
