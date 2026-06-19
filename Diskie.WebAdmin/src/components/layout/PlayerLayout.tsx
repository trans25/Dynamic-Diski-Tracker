import { Outlet, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonIcon from '@mui/icons-material/Person'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import { useAuth } from '../../auth/AuthContext'

export function PlayerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <Box sx={{ minHeight: '100svh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Toolbar sx={{ minHeight: '72px !important', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <SportsSoccerIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                Player Dashboard
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Diski Tracker Hub
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Stack spacing={0} sx={{ alignItems: 'flex-end' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user ? `${user.firstName} ${user.lastName}` : 'Player'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email ?? 'Signed in'}
              </Typography>
            </Stack>
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
              {initials || <PersonIcon fontSize="small" />}
            </Avatar>
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={() => {
                logout()
                navigate('/sign-in', { replace: true })
              }}
            >
              Sign out
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
