import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Students, faculty, and staff must complete profile before accessing dashboard
  if (["student", "faculty", "staff"].includes(user.role) && !user.profileComplete) {
    return <Navigate to="/create-profile" replace />;
  }

  return children;
};

export default ProtectedRoute;
