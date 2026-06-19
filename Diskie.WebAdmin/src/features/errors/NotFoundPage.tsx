import { Box, Button, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
      }}
    >
      <Stack spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant="h1" color="text.secondary" sx={{ fontWeight: 800 }}>
          404
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Page not found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The page you're looking for doesn't exist or has been moved.
        </Typography>
        <Button component={RouterLink} to="/" variant="contained">
          Back to Dashboard
        </Button>
      </Stack>
    </Box>
  )
}
