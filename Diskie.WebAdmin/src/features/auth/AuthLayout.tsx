import { Box, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { Logo } from '../../components/Logo'

/**
 * Centered auth layout ported from the original diskiweb admin
 * (Diskie.WebAdmin/src/features/auth/auth-layout.tsx).
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100svh',
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: 4,
        bgcolor: 'background.default',
      }}
    >
      <Stack spacing={2} sx={{ width: '100%', maxWidth: 400 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Logo size={28} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Diski Tracker Hub
          </Typography>
        </Stack>
        {children}
      </Stack>
    </Box>
  )
}
