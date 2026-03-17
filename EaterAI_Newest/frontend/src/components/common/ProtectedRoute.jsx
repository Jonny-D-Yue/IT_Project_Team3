import { Navigate, Outlet } from "react-router-dom";

import Loader from "./Loader";
import { useAuth } from "../../hooks/useAuth";
import { useTable } from "../../hooks/useTable";

export default function ProtectedRoute({
  allowedRoles,
  redirectTo = "/staff/login",
  requireTable = false,
}) {
  const { loading, isAuthenticated, user } = useAuth();
  const { hasTableSession, restaurantId, tableNumber, sessionToken } = useTable();

  if (requireTable && (!hasTableSession || !restaurantId || !tableNumber || !sessionToken)) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles) {
    if (loading) {
      return <Loader label="Checking access..." />;
    }

    if (!isAuthenticated) {
      return <Navigate to={redirectTo} replace />;
    }

    if (!allowedRoles.includes(user?.role)) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <Outlet />;
}
