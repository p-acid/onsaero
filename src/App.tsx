import { useEffect, useState } from "react";
import { RouterProvider } from "react-router";
import { router } from "./lib/router";
import { useAuthStore } from "./stores/authStore";
import { themeClass } from "./styles/theme.css";

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Initialize auth state on app mount
    initialize().finally(() => {
      setIsInitialized(true);
    });
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className={themeClass}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            backgroundColor: "var(--color-background, #f5f5f5)",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "var(--color-text-secondary, #666)",
            }}
          >
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={themeClass}>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
