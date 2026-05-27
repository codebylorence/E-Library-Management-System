import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import cvsulogo from "../assets/CvSU-Logo.webp";

const Login = () => {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/users/auth/google";
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(email, password);
      if (user.role === "admin" || user.role === "librarian") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/student/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">

      {/* Back to home */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-5 left-5 flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#227325] bg-gray-100 hover:bg-green-50 border border-gray-200 hover:border-[#227325] px-3 py-2 rounded-lg transition-colors"
      >
        <ArrowLeft size={16} /> Back to Home
      </button>

      {/* Logo + system name */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <img src={cvsulogo} alt="CvSU" className="w-16 h-16 object-contain" />
        <p className="text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase">
          E-Library Management System
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-xs flex flex-col gap-3">

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          {/* Google "G" icon */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Email/password toggle */}
        {!showEmail ? (
          <button
            onClick={() => setShowEmail(true)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Sign in with Email
          </button>
        ) : (
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-2">
            {error && (
              <p className="text-xs text-red-500 text-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#227325] transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#227325] transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#227325] hover:bg-[#1a5c1d] text-white rounded-lg px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {/* Guest */}
        <button
          onClick={() => navigate("/guest/catalogs")}
          className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
};

export default Login;
