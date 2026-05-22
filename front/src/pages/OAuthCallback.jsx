import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { setUserFromOAuth } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userRaw = params.get("user");

    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));
        setUserFromOAuth(token, user);

        // Admins and librarians skip profile setup
        if (user.role === "admin" || user.role === "librarian") {
          navigate("/admin/dashboard", { replace: true });
        } else if (!user.profileComplete) {
          navigate("/create-profile", { replace: true });
        } else {
          navigate("/student/dashboard", { replace: true });
        }
      } catch {
        navigate("/", { replace: true });
      }
    } else {
      navigate("/", { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-sm">Signing you in with Google...</p>
    </div>
  );
};

export default OAuthCallback;
