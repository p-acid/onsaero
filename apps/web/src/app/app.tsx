import { AuthContextProvider, queryClient } from '@onsaero/shared'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { webAuthStore } from '@/shared/store'
import { router } from './router'

import '@onsaero/shared/styles.css'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider store={webAuthStore}>
        <RouterProvider router={router} />
      </AuthContextProvider>
    </QueryClientProvider>
  )
}

export default App
