import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Catalogs from "./pages/Catalogs";
import Admin from "./layout/Admin";
import Student from "./layout/Student";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Books from "./pages/Books";
import OAuthCallback from "./pages/OAuthCallback";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/catalogs" element={<Catalogs />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />

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
          <Route path="users" element={<div className="p-6"><h1 className="text-xl font-bold text-gray-800">Users — coming soon</h1></div>} />
        </Route>

        {/* Student nested routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Student />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="books" element={<StudentDashboard />} />
        </Route>

        {/* Unauthorized fallback */}
        <Route
          path="/unauthorized"
          element={
            <div className="flex min-h-screen items-center justify-center text-gray-600">
              Access Denied
            </div>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
