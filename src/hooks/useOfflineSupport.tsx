import type React from "react";
import { useEffect, useState } from "react";
import { getTasks } from "../lib/storage";
import { syncPendingToServer } from "../lib/sync";
import { useTaskStore } from "../stores/taskStore";

interface OfflineStatus {
  isOnline: boolean;
  pendingSync: number;
  lastSync: Date | null;
}

/**
 * Hook to manage offline support and sync queue
 * Monitors online/offline status and syncs pending changes when back online
 */
export function useOfflineSupport() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    pendingSync: 0,
    lastSync: null,
  });

  useEffect(() => {
    const updatePendingCount = async () => {
      const allTasks = await getTasks();
      const pending = allTasks.filter(
        (t) => t.sync_status === "pending"
      ).length;
      setStatus((prev) => ({ ...prev, pendingSync: pending }));
    };

    updatePendingCount();
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      console.log("Back online - syncing pending changes");
      setStatus((prev) => ({ ...prev, isOnline: true }));

      // Sync pending tasks when back online
      const allTasks = await getTasks();
      const result = await syncPendingToServer(allTasks);

      if (result.success) {
        console.log(`Synced ${result.synced} tasks`);
        setStatus((prev) => ({
          ...prev,
          pendingSync: 0,
          lastSync: new Date(),
        }));

        // Refresh tasks in store
        const updatedTasks = await getTasks();
        useTaskStore.getState().setTasks(updatedTasks);
      } else {
        console.error(`Failed to sync ${result.failed} tasks`);
      }
    };

    const handleOffline = () => {
      console.log("Offline - changes will be queued for sync");
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const forceSyncNow = async () => {
    if (!status.isOnline) {
      console.warn("Cannot sync while offline");
      return { success: false, error: "Offline" };
    }

    const allTasks = await getTasks();
    const result = await syncPendingToServer(allTasks);

    if (result.success) {
      setStatus((prev) => ({ ...prev, pendingSync: 0, lastSync: new Date() }));
    }

    return result;
  };

  return {
    ...status,
    forceSyncNow,
  };
}

/**
 * Offline status indicator component
 */
export function OfflineIndicator(): React.ReactElement | null {
  const { isOnline, pendingSync } = useOfflineSupport();

  if (isOnline && pendingSync === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        right: "16px",
        padding: "12px 16px",
        backgroundColor: isOnline ? "#3B82F6" : "#EF4444",
        color: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        fontSize: "14px",
        fontWeight: 500,
        zIndex: 1000,
      }}
    >
      {isOnline ? (
        pendingSync > 0 && (
          <>
            🔄 Syncing {pendingSync} {pendingSync === 1 ? "task" : "tasks"}...
          </>
        )
      ) : (
        <>📡 Offline - changes saved locally</>
      )}
    </div>
  );
}
