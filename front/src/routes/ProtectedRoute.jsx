import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const getDashboard = (role) => {
  if (role === "admin" || role === "librarian") return "/admin/dashboard";
  return "/student/dashboard";
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  // Not logged in — send to home/login
  if (!user) return <Navigate to="/" replace />;

  // Wrong role — send to their own dashboard instead of a dead-end
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboard(user.role)} replace />;
  }

  // Students, faculty, and staff must complete profile first
  if (["student", "faculty", "staff"].includes(user.role) && !user.profileComplete) {
    return <Navigate to="/create-profile" replace />;
  }

  return children;
};

export default ProtectedRoute;
