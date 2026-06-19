import { Card, CardContent, Stack, Typography, Box } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'

type StatCardProps = {
  title: string
  value: string | number
  caption?: string
  icon: SvgIconComponent
}

export function StatCard({ title, value, caption, icon: Icon }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 500 }}
          >
            {title}
          </Typography>
          <Box sx={{ color: 'text.secondary' }}>
            <Icon fontSize="small" />
          </Box>
        </Stack>
        <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
          {value}
        </Typography>
        {caption && (
          <Typography variant="caption" color="text.secondary">
            {caption}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
