import { Navigate, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

export function Guard({
  children,
  roles,
}: {
  children: ReactElement;
  roles?: UserRole[];
}) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  if (roles && !roles.includes(session.user.role)) {
    return <Navigate replace to="/" />;
  }

  return children;
}
