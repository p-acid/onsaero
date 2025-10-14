/**
 * Router Configuration
 *
 * Centralized routing configuration using React Router v6
 * Defines protected and public routes with authentication guards
 *
 * @module lib/router
 */

import { createMemoryRouter, redirect } from "react-router";
import { ProtectedRoute } from "../components/guards/ProtectedRoute";
import { Dashboard } from "../pages/Dashboard";
import { Landing } from "../pages/Landing";
import { Login } from "../pages/Login";
import { useAuthStore } from "../stores/authStore";

async function publicRouteLoader() {
  const store = useAuthStore.getState();

  if (store.user && store.session) {
    console.log("[Router] User already authenticated, redirecting to /tasks");
    throw redirect("/tasks");
  }

  return null;
}

async function protectedRouteLoader() {
  const { session } = useAuthStore.getState();

  if (!session) {
    throw redirect("/login");
  }

  return null;
}

function LoadingFallback() {
  return (
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
  );
}

export const router = createMemoryRouter([
  {
    path: "/",
    element: <Landing />,
    loader: publicRouteLoader,
    HydrateFallback: LoadingFallback,
  },
  {
    path: "/login",
    element: <Login />,
    loader: publicRouteLoader,
    HydrateFallback: LoadingFallback,
  },
  {
    path: "/tasks",
    element: (
      <ProtectedRoute>
        <div>Tasks</div>
      </ProtectedRoute>
    ),
    loader: protectedRouteLoader,
    HydrateFallback: LoadingFallback,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
    loader: protectedRouteLoader,
    HydrateFallback: LoadingFallback,
  },
]);
