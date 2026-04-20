import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Library,
} from "lucide-react";

// Nav items per role
const NAV_ITEMS = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
    { label: "Books",     icon: BookOpen,        to: "/admin/books"     },
    { label: "Users",     icon: Users,           to: "/admin/users"     },
  ],
  librarian: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
    { label: "Books",     icon: BookOpen,        to: "/admin/books"     },
  ],
  student: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/student/dashboard" },
    { label: "Books",     icon: BookOpen,        to: "/student/books"     },
  ],
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const items = NAV_ITEMS[user?.role] ?? [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={`relative flex flex-col bg-[#227325] text-white min-h-screen transition-all duration-300 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/20">
        <Library size={22} className="shrink-0" />
        {!collapsed && (
          <span className="text-sm font-bold leading-tight">E-Library</span>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {items.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white text-[#227325]"
                  : "text-white/80 hover:bg-white/15"
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info + Logout */}
      <div className="border-t border-white/20 px-2 py-4 space-y-1">
        {!collapsed && (
          <div className="px-3 py-2 text-xs text-white/60 truncate">
            <p className="font-semibold text-white truncate">{user?.fullName}</p>
            <p className="capitalize">{user?.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/15 transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-6 bg-[#227325] border border-white/30 rounded-full p-0.5 hover:bg-[#1a5c1d] transition-colors"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
};

export default Sidebar;
