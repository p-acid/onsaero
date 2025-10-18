import { AuthContextProvider } from '@onsaero/shared'
import { RouterProvider } from 'react-router'
import { webAuthStore } from '@/shared/store'
import { router } from './router'

function App() {
  return (
    <AuthContextProvider store={webAuthStore}>
      <RouterProvider router={router} />
    </AuthContextProvider>
  )
}

export default App
