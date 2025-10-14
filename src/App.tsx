import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './lib/router'
import { useAuthStore } from './stores/authStore'
import { themeClass } from './styles/theme.css'

function App() {
  // Initialize auth state on app mount
  // Checks for existing session in Chrome storage
  useEffect(() => {
    useAuthStore.getState().initialize()
  }, [])

  return (
    <div className={themeClass}>
      <RouterProvider router={router} />
    </div>
  )
}

export default App
