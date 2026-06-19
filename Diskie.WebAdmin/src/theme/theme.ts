import { createTheme, type ThemeOptions } from '@mui/material/styles'
import type { PaletteMode } from '@mui/material'

/**
 * Color palette ported from the original "diskiweb admin" (shadcn) template
 * defined in Diskie.WebAdmin/src/styles/theme.css. The original values are in
 * oklch; the closest sRGB hex equivalents are used here so the MUI build keeps
 * the same look and feel (near-black primary, neutral grays, same chart hues).
 */

// Shared chart colors (used by dashboard charts in both modes).
export const chartColors = {
  light: ['#e8612d', '#2aa198', '#2d5f8a', '#e0a93b', '#df9248'],
  dark: ['#7c5cff', '#36c692', '#e0a93b', '#a855f7', '#e23670'],
}

const radius = 10 // 0.625rem from the original --radius

function getDesignTokens(mode: PaletteMode): ThemeOptions {
  const isLight = mode === 'light'

  return {
    palette: {
      mode,
      ...(isLight
        ? {
            primary: {
              main: '#1e2532',
              contrastText: '#fafbfc',
            },
            secondary: {
              main: '#f1f3f7',
              contrastText: '#1e2532',
            },
            background: {
              default: '#ffffff',
              paper: '#ffffff',
            },
            text: {
              primary: '#0b1120',
              secondary: '#6b7280',
            },
            divider: '#e5e8ed',
            error: {
              main: '#dc2626',
            },
            success: {
              main: '#16a34a',
            },
            warning: {
              main: '#d97706',
            },
            info: {
              main: '#2563eb',
            },
          }
        : {
            primary: {
              main: '#e7ebf0',
              contrastText: '#1e2532',
            },
            secondary: {
              main: '#2a3140',
              contrastText: '#e7ebf0',
            },
            background: {
              default: '#0b1120',
              paper: '#131a2a',
            },
            text: {
              primary: '#f7f9fb',
              secondary: '#9aa4b2',
            },
            divider: 'rgba(255, 255, 255, 0.10)',
            error: {
              main: '#f87171',
            },
            success: {
              main: '#4ade80',
            },
            warning: {
              main: '#fbbf24',
            },
            info: {
              main: '#60a5fa',
            },
          }),
    },
    shape: {
      borderRadius: radius,
    },
    typography: {
      fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, sans-serif",
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700, fontSize: '1.5rem' },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: radius - 2,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: radius,
            border: `1px solid ${isLight ? '#e5e8ed' : 'rgba(255,255,255,0.10)'}`,
            backgroundImage: 'none',
          },
        },
        defaultProps: {
          elevation: 0,
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiAppBar: {
        defaultProps: {
          elevation: 0,
          color: 'inherit',
        },
      },
    },
  }
}

export function buildTheme(mode: PaletteMode) {
  return createTheme(getDesignTokens(mode))
}
