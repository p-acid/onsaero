import { useEffect, useState } from 'react'
import { getStorageUsage } from '../lib/storage'

interface StorageQuotaInfo {
  bytes: number
  limit: number
  usage: number
  usagePercent: number
  isNearLimit: boolean
  isAvailable: boolean
}

/**
 * React hook to monitor chrome.storage.sync quota usage
 * Updates automatically when storage changes
 */
export function useStorageQuota() {
  const [quotaInfo, setQuotaInfo] = useState<StorageQuotaInfo>({
    bytes: 0,
    limit: 102400, // 100KB
    usage: 0,
    usagePercent: 0,
    isNearLimit: false,
    isAvailable: !!chrome?.storage?.sync,
  })

  const refreshQuota = async () => {
    const usage = await getStorageUsage()
    setQuotaInfo({
      ...usage,
      usagePercent: Math.round(usage.usage * 100),
      isAvailable: !!chrome?.storage?.sync,
    })
  }

  useEffect(() => {
    // Initial check
    refreshQuota()

    // Setup listener for storage changes
    if (chrome?.storage?.onChanged) {
      const listener = () => {
        refreshQuota()
      }

      chrome.storage.onChanged.addListener(listener)

      return () => {
        chrome.storage.onChanged.removeListener(listener)
      }
    }
  }, [])

  return {
    ...quotaInfo,
    refresh: refreshQuota,
  }
}

/**
 * Component to display storage quota warning
 */
export function StorageQuotaWarning({
  threshold = 80,
}: {
  threshold?: number
}) {
  const { usagePercent, isNearLimit, bytes, limit } = useStorageQuota()

  if (!isNearLimit || usagePercent < threshold) {
    return null
  }

  const handleCleanup = async () => {
    if (
      confirm(
        'This will remove old completed tasks from local storage to free up space. Tasks will still be saved in the cloud. Continue?',
      )
    ) {
      chrome.runtime.sendMessage({ type: 'TRIGGER_CLEANUP' })
    }
  }

  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: '#FEF3C7',
        border: '1px solid #F59E0B',
        borderRadius: '8px',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <strong>Storage Nearly Full</strong>
          <p
            style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#92400E' }}
          >
            Using {bytes.toLocaleString()} / {limit.toLocaleString()} bytes (
            {usagePercent}%)
          </p>
        </div>
        <button
          onClick={handleCleanup}
          style={{
            padding: '8px 16px',
            backgroundColor: '#F59E0B',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
          type="button"
        >
          Clean Up
        </button>
      </div>
    </div>
  )
}
