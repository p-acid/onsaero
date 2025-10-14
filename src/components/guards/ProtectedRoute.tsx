import { useAuthGuard } from "../../hooks/useAuthGuard";
import type { ProtectedRouteProps } from "../../lib/types";
import { LoadingSpinner } from "../ui/LoadingSpinner";

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isLoading } = useAuthGuard();

  if (isLoading) {
    return fallback || <LoadingSpinner text="Checking authentication..." />;
  }

  return children;
}
