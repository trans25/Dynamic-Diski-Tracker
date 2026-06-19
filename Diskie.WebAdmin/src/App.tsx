import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { ColorModeProvider } from './theme/ColorModeContext'
import { NotificationProvider } from './components/NotificationProvider'
import { AuthProvider } from './auth/AuthContext'
import { router } from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
  },
})

function App() {
  return (
    <ColorModeProvider>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </ColorModeProvider>
  )
}

export default App
