import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useTaskStore } from '../stores/taskStore'
import {
  actionButton,
  actionButtons,
  popupContainer,
  popupHeader,
  popupTitle,
  quickStats,
  statItem,
  statLabel,
  statValue,
} from './Popup.css'

function Popup() {
  const tasks = useTaskStore((state) => state.tasks)
  const [storageUsage, setStorageUsage] = useState(0)

  useEffect(() => {
    // Load tasks from storage
    chrome.storage.sync.get(['tasks'], (result) => {
      if (result.tasks) {
        useTaskStore.getState().setTasks(result.tasks)
      }
    })

    // Check storage usage
    chrome.storage.sync.getBytesInUse().then((bytes) => {
      const limit = chrome.storage.sync.QUOTA_BYTES
      setStorageUsage(Math.round((bytes / limit) * 100))
    })
  }, [])

  const activeTasks = tasks.filter((t) => !t.completed)
  const completedTasks = tasks.filter((t) => t.completed)

  const handleOpenNewTab = () => {
    chrome.tabs.create({ url: 'chrome://newtab' })
    window.close()
  }

  const handleSync = () => {
    chrome.runtime.sendMessage({ type: 'SYNC_NOW' })
    window.close()
  }

  const handleCleanup = () => {
    if (
      confirm(
        'This will remove old completed tasks from local storage. Continue?',
      )
    ) {
      chrome.runtime.sendMessage({ type: 'TRIGGER_CLEANUP' })
      window.close()
    }
  }

  return (
    <div className={popupContainer}>
      <div className={popupHeader}>
        <h1 className={popupTitle}>Onsaero Tasks</h1>
      </div>

      <div className={quickStats}>
        <div className={statItem}>
          <div className={statValue}>{activeTasks.length}</div>
          <div className={statLabel}>Active</div>
        </div>
        <div className={statItem}>
          <div className={statValue}>{completedTasks.length}</div>
          <div className={statLabel}>Completed</div>
        </div>
        <div className={statItem}>
          <div className={statValue}>{storageUsage}%</div>
          <div className={statLabel}>Storage</div>
        </div>
      </div>

      <div className={actionButtons}>
        <button onClick={handleOpenNewTab} className={actionButton}>
          Open Dashboard
        </button>
        <button onClick={handleSync} className={actionButton}>
          Sync Now
        </button>
        {storageUsage > 50 && (
          <button onClick={handleCleanup} className={actionButton}>
            Cleanup Storage
          </button>
        )}
      </div>
    </div>
  )
}

// Mount popup
const container = document.getElementById('popup-root')
if (container) {
  const root = createRoot(container)
  root.render(<Popup />)
}
