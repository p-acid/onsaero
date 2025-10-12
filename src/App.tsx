import { useEffect } from 'react'
import { themeClass } from './styles/theme.css'
import { useTaskStore } from './stores/taskStore'

function App() {
  const loadFromStorage = useTaskStore((state) => state.loadFromStorage)

  useEffect(() => {
    // Load tasks from chrome.storage.sync on mount
    loadFromStorage()
  }, [loadFromStorage])

  return (
    <div className={themeClass}>
      <h1>Onsaero Tasks</h1>
      <p>Task management extension - Phase 2 foundation complete</p>
    </div>
  )
}

export default App
