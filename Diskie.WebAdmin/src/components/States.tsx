import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { keyframes } from '@mui/system'
import type { ReactNode } from 'react'
import { Logo } from './Logo'

const logoFloat = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
  100% { transform: translateY(0px); }
`

const glowPulse = keyframes`
  0% { opacity: 0.15; transform: scale(0.98); }
  50% { opacity: 0.28; transform: scale(1.02); }
  100% { opacity: 0.15; transform: scale(0.98); }
`

function LoaderBrand() {
  return (
    <Stack spacing={1} sx={{ alignItems: 'center' }}>
      <Box sx={{ position: 'relative', height: 72, width: 72, display: 'grid', placeItems: 'center' }}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            bgcolor: '#2f6fc5',
            animation: `${glowPulse} 2.2s ease-in-out infinite`,
          }}
        />
        <Logo
          size={44}
          sx={{
            color: '#2f6fc5',
            animation: `${logoFloat} 1.9s ease-in-out infinite`,
            zIndex: 1,
          }}
        />
      </Box>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: '#2f6fc5',
          lineHeight: 1.05,
        }}
      >
        DiskiTrack
      </Typography>
    </Stack>
  )
}

export function LoadingState({
  label = 'Loading…',
  fullPage = true,
}: {
  label?: string
  fullPage?: boolean
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        py: fullPage ? 10 : 6,
        minHeight: fullPage ? '60vh' : 'auto',
      }}
    >
      <Card
        variant="outlined"
        sx={{
          width: '100%',
          maxWidth: 460,
          borderRadius: 3,
          boxShadow: 2,
        }}
      >
        <CardContent sx={{ py: 4 }}>
          <Stack spacing={2.5} sx={{ alignItems: 'center' }}>
            <LoaderBrand />
            <CircularProgress size={46} thickness={4.4} />
            <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center' }}>
              Please wait
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {label}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export function AppLoaderOverlay({
  open,
  label = 'Processing request…',
}: {
  open: boolean
  label?: string
}) {
  return (
    <Backdrop
      open={open}
      sx={(theme) => ({
        zIndex: theme.zIndex.modal + 1,
        backgroundColor: alpha(theme.palette.background.default, 0.72),
        backdropFilter: 'blur(2px)',
      })}
    >
      <Card
        variant="outlined"
        sx={{
          width: '100%',
          maxWidth: 460,
          borderRadius: 3,
          boxShadow: 4,
        }}
      >
        <CardContent sx={{ py: 4 }}>
          <Stack spacing={2.5} sx={{ alignItems: 'center' }}>
            <LoaderBrand />
            <CircularProgress size={52} thickness={4.6} />
            <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center' }}>
              Please wait
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {label}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Backdrop>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  )
}

export function EmptyState({
  title = 'Nothing here yet',
  description,
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  )
}
