import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./layout/Admin";
import Student from "./layout/Student";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentCatalogs from "./pages/StudentCatalogs";
import Books from "./pages/Books";
import Users from "./pages/Users";
import AdminBorrows from "./pages/AdminBorrows";
import AdminAttendance from "./pages/AdminAttendance";
import MyBorrows from "./pages/MyBorrows";
import MyQR from "./pages/MyQR";
import MyReservations from "./pages/MyReservations";
import AdminReservations from "./pages/AdminReservations";
import OAuthCallback from "./pages/OAuthCallback";
import CreateProfile from "./pages/CreateProfile";
import BookDetail from "./pages/BookDetail";
import Unauthorized from "./pages/Unauthorized";
import GuestCatalogs from "./pages/GuestCatalogs";
import GuestBookDetail from "./pages/GuestBookDetail";

import "./App.css";

/* Redirect logged-in users away from public pages (home, login) */
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return children;
  if (user.role === "admin" || user.role === "librarian") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/student/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes — redirect to dashboard if already logged in */}
        <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/guest/catalogs" element={<GuestCatalogs />} />
        <Route path="/guest/books/:id" element={<GuestBookDetail />} />

        {/* Admin / Librarian nested routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "librarian"]}>
              <Admin />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="books" element={<Books />} />
          <Route path="users" element={<Users />} />
          <Route path="borrows" element={<AdminBorrows />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="reservations" element={<AdminReservations />} />
        </Route>

        {/* Student / Faculty / Staff nested routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student", "faculty", "staff"]}>
              <Student />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="books" element={<StudentCatalogs />} />
          <Route path="books/:id" element={<BookDetail />} />
          <Route path="borrows" element={<MyBorrows />} />
          <Route path="qr" element={<MyQR />} />
          <Route path="reservations" element={<MyReservations />} />
        </Route>

        {/* Unauthorized */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
