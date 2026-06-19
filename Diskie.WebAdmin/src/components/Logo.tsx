import { Box, type SxProps, type Theme } from '@mui/material'

type LogoProps = {
  size?: number
  sx?: SxProps<Theme>
}

/**
 * Logo ported from the original diskiweb admin template
 * (Diskie.WebAdmin/src/assets/logo.tsx).
 */
export function Logo({ size = 28, sx }: LogoProps) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      sx={{
        height: size,
        width: size,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        ...sx,
      }}
    >
      <title>DiskiTrack</title>
      <circle cx="12" cy="12" r="9" />

      <path d="M12 7.05 9.35 8.95l1.02 3.08h3.26l1.02-3.08z" />

      <path d="M9.35 8.95 7.1 7.95l-1.55 2.26 1.22 2.75 3.58-.19" />
      <path d="M14.65 8.95 16.9 7.95l1.55 2.26-1.22 2.75-3.58-.19" />
      <path d="M10.32 12.5 9.3 15.52 12 17.42l2.7-1.9-1.02-3.02" />

      <path d="M7.1 7.95 6.38 6.12" />
      <path d="M16.9 7.95l.72-1.83" />
      <path d="M9.3 15.52 7.35 16.62" />
      <path d="M14.7 15.52l1.95 1.1" />
    </Box>
  )
}
