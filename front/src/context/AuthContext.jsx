import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

/* ── Session timeout config ─────────────────────────────
   IDLE_TIMEOUT  : ms of inactivity before auto-logout
   WARN_BEFORE   : ms before logout to show the warning modal
──────────────────────────────────────────────────────── */
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARN_BEFORE  =  2 * 60 * 1000; //  2 minutes warning

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  /* warning modal state */
  const [showWarning,   setShowWarning]   = useState(false);
  const [countdown,     setCountdown]     = useState(0); // seconds remaining

  const idleTimer    = useRef(null);
  const warnTimer    = useRef(null);
  const countdownRef = useRef(null);

  /* ── logout ── */
  const logout = useCallback(() => {
    clearTimeout(idleTimer.current);
    clearTimeout(warnTimer.current);
    clearInterval(countdownRef.current);
    setShowWarning(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  /* ── reset timers on activity ── */
  const resetTimers = useCallback(() => {
    if (!localStorage.getItem("token")) return; // not logged in

    clearTimeout(idleTimer.current);
    clearTimeout(warnTimer.current);
    clearInterval(countdownRef.current);
    setShowWarning(false);

    // Show warning WARN_BEFORE ms before logout
    warnTimer.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(Math.round(WARN_BEFORE / 1000));

      // Tick countdown every second
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }, IDLE_TIMEOUT - WARN_BEFORE);

    // Auto-logout after full idle timeout
    idleTimer.current = setTimeout(() => {
      logout();
      window.location.href = "/login";
    }, IDLE_TIMEOUT);
  }, [logout]);

  /* ── attach/detach activity listeners when user changes ── */
  useEffect(() => {
    if (!user) {
      clearTimeout(idleTimer.current);
      clearTimeout(warnTimer.current);
      clearInterval(countdownRef.current);
      setShowWarning(false);
      return;
    }

    resetTimers();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetTimers, { passive: true }));

    return () => {
      clearTimeout(idleTimer.current);
      clearTimeout(warnTimer.current);
      clearInterval(countdownRef.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimers));
    };
  }, [user, resetTimers]);

  /* ── login ── */
  const login = async (email, password) => {
    const { data } = await api.post("/users/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const setUserFromOAuth = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  /* ── "Stay logged in" — just resets the timers ── */
  const stayLoggedIn = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  /* ── format countdown as mm:ss ── */
  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setUserFromOAuth }}>
      {children}

      {/* ── Session expiry warning modal ── */}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center space-y-5">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800">Session Expiring Soon</h2>
              <p className="text-sm text-gray-500 mt-1">
                You've been inactive. You'll be logged out in
              </p>
              {/* Countdown */}
              <p className="text-4xl font-bold text-yellow-500 mt-3 tabular-nums">
                {formatCountdown(countdown)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { logout(); window.location.href = "/login"; }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Logout Now
              </button>
              <button
                onClick={stayLoggedIn}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#227325] rounded-xl hover:bg-[#1a5a1d] transition-colors"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
