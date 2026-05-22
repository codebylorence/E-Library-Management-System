import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  LogOut,
  ChevronLeft,
  Menu,
  Library,
  BookMarked,
  QrCode,
  ClipboardList,
} from "lucide-react";

// Nav items per role
const NAV_ITEMS = {
  admin: [
    { label: "Dashboard",  icon: LayoutDashboard, to: "/admin/dashboard"    },
    { label: "Books",      icon: BookOpen,        to: "/admin/books"        },
    { label: "Borrows",    icon: BookMarked,      to: "/admin/borrows"      },
    { label: "Attendance", icon: ClipboardList,   to: "/admin/attendance"   },
    { label: "Users",      icon: Users,           to: "/admin/users"        },
  ],
  librarian: [
    { label: "Dashboard",  icon: LayoutDashboard, to: "/admin/dashboard"    },
    { label: "Books",      icon: BookOpen,        to: "/admin/books"        },
    { label: "Borrows",    icon: BookMarked,      to: "/admin/borrows"      },
    { label: "Attendance", icon: ClipboardList,   to: "/admin/attendance"   },
  ],
  student: [
    { label: "Dashboard",  icon: LayoutDashboard, to: "/student/dashboard"  },
    { label: "Catalogs",   icon: BookOpen,        to: "/student/books"      },
    { label: "My Borrows", icon: BookMarked,      to: "/student/borrows"    },
    { label: "My QR Code", icon: QrCode,          to: "/student/qr"         },
  ],
  faculty: [
    { label: "Dashboard",  icon: LayoutDashboard, to: "/student/dashboard"  },
    { label: "Catalogs",   icon: BookOpen,        to: "/student/books"      },
    { label: "My Borrows", icon: BookMarked,      to: "/student/borrows"    },
    { label: "My QR Code", icon: QrCode,          to: "/student/qr"         },
  ],
  staff: [
    { label: "Dashboard",  icon: LayoutDashboard, to: "/student/dashboard"  },
    { label: "Catalogs",   icon: BookOpen,        to: "/student/books"      },
    { label: "My Borrows", icon: BookMarked,      to: "/student/borrows"    },
    { label: "My QR Code", icon: QrCode,          to: "/student/qr"         },
  ],
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const items = NAV_ITEMS[user?.role] ?? [];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside
      className={`relative flex flex-col bg-[#227325] text-white min-h-screen transition-all duration-300 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Header with integrated toggle */}
      <div className={`flex items-center border-b border-white/10 px-4 py-4 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center gap-3 animate-in fade-in duration-200">
            <Library size={22} className="shrink-0 text-white/90" />
            <span className="text-sm font-bold leading-tight tracking-wide">E-Library</span>
          </div>
        )}
        
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {items.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive ? "bg-white text-[#227325]" : "text-white/80 hover:bg-white/10"
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="animate-in fade-in duration-200">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="border-t border-white/10 px-2 py-4 space-y-1">
        {user && (
          <>
            {collapsed ? (
              <div className="flex justify-center py-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold uppercase">
                  {user.fullName?.charAt(0) || "U"}
                </div>
              </div>
            ) : (
              <div className="px-3 py-1 text-xs text-white/60 truncate animate-in fade-in duration-200">
                <p className="font-semibold text-white truncate">{user.fullName}</p>
                <p className="capitalize text-white/50">{user.role}</p>
              </div>
            )}
          </>
        )}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-red-600/20 hover:text-red-200 transition-colors group"
        >
          <LogOut size={18} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
          {!collapsed && <span className="animate-in fade-in duration-200">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;