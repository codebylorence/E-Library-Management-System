import { useNavigate } from "react-router-dom";
import { ShieldX, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Unauthorized = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const dashboardPath =
    !user ? "/"
    : user.role === "admin" || user.role === "librarian"
      ? "/admin/dashboard"
      : "/student/dashboard";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center space-y-5">
        <div className="flex justify-center">
          <div className="p-4 bg-red-50 rounded-2xl">
            <ShieldX size={40} className="text-red-500" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Access Denied</h1>
          <p className="text-gray-500 text-sm mt-2">
            You don't have permission to view this page.
            {user && (
              <span> Your current role is <span className="font-semibold text-gray-700 capitalize">{user.role}</span>.</span>
            )}
          </p>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600">
          If you believe this is a mistake, please contact the library administrator.
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {user ? (
            <button
              onClick={() => navigate(dashboardPath)}
              className="flex items-center justify-center gap-2 w-full bg-[#227325] hover:bg-[#1a5c1d] text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <Home size={15} /> Go to My Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-2 w-full bg-[#227325] hover:bg-[#1a5c1d] text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <Home size={15} /> Go to Home
            </button>
          )}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <ArrowLeft size={15} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
