import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Alert, Snackbar, type AlertColor } from '@mui/material'

type Notify = (message: string, severity?: AlertColor) => void

const NotificationContext = createContext<Notify>(() => {})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<AlertColor>('info')

  const notify = useCallback<Notify>((msg, sev = 'info') => {
    setMessage(msg)
    setSeverity(sev)
    setOpen(true)
  }, [])

  const value = useMemo(() => notify, [notify])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity={severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotify() {
  return useContext(NotificationContext)
}
