import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../utils/constants";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="grid h-screen place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.mustChangePassword && pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }
  if (!user.mustChangePassword && pathname === "/change-password") {
    return <Navigate to={homeFor(user.role)} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />;
  }

  return children;
}