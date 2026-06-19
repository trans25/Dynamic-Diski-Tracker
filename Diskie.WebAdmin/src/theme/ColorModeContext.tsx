import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import type { PaletteMode } from '@mui/material'
import { buildTheme } from './theme'

type ColorModeContextValue = {
  mode: PaletteMode
  toggleColorMode: () => void
}

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'light',
  toggleColorMode: () => {},
})

const STORAGE_KEY = 'diskie-color-mode'

function getInitialMode(): PaletteMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  const prefersDark =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode)
    document.documentElement.classList.toggle('dark', mode === 'dark')
  }, [mode])

  const value = useMemo<ColorModeContextValue>(
    () => ({
      mode,
      toggleColorMode: () =>
        setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    [mode]
  )

  const theme = useMemo(() => buildTheme(mode), [mode])

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useColorMode() {
  return useContext(ColorModeContext)
}
