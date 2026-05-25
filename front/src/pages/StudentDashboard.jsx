import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  BookOpen, BookMarked, Clock, AlertTriangle, CheckCircle,
  CalendarDays, QrCode, ChevronRight, PhilippinePeso,
  Library, Hourglass, BookCheck,
} from "lucide-react";
import api from "../api/axios";
import CoverImage from "../components/CoverImage";

/* ── helpers ─────────────────────────────────── */
const todayPH = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

const greet = () => {
  const h = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  ).getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

/* ── sub-components ──────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, color, to }) => {
  const inner = (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${color} shrink-0`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800 leading-tight">{value ?? "—"}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
      {to && <ChevronRight size={16} className="ml-auto text-gray-300 shrink-0" />}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
};

const statusMeta = {
  pending:  { label: "Pending",  color: "bg-yellow-100 text-yellow-700" },
  borrowed: { label: "Borrowed", color: "bg-blue-100 text-blue-700"    },
  overdue:  { label: "Overdue",  color: "bg-red-100 text-red-600"      },
  returned: { label: "Returned", color: "bg-green-100 text-green-700"  },
  rejected: { label: "Rejected", color: "bg-gray-100 text-gray-500"    },
};

/* ── main page ───────────────────────────────── */
const StudentDashboard = () => {
  const { user } = useAuth();

  const [books, setBooks]         = useState([]);
  const [borrows, setBorrows]     = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/books"),
      api.get("/borrows/my"),
      api.get("/attendance/my"),
    ])
      .then(([booksRes, borrowsRes, attRes]) => {
        setBooks(booksRes.data.books);
        setBorrows(borrowsRes.data.borrows);
        setAttendance(attRes.data.records);
      })
      .finally(() => setLoading(false));
  }, []);

  /* derived stats */
  const totalBooks    = books.length;
  const available     = books.filter((b) => b.status === "available").length;
  const activeBorrows = borrows.filter((b) => b.status === "borrowed" || b.status === "overdue");
  const pendingBorrows = borrows.filter((b) => b.status === "pending");
  const overdueBorrows = borrows.filter((b) => b.status === "overdue");
  const unpaidFines   = borrows.filter((b) => b.fineStatus === "unpaid");
  const totalFine     = unpaidFines.reduce((s, b) => s + Number(b.fineAmount || 0), 0);

  const todayAttended = attendance.some((r) => r.date === todayPH());
  const recentAttendance = attendance.slice(0, 5);

  /* active + pending borrows to show in the card list */
  const highlightBorrows = [
    ...overdueBorrows,
    ...activeBorrows.filter((b) => b.status === "borrowed"),
    ...pendingBorrows,
  ].slice(0, 4);

  const isFaculty = user?.role === "faculty" || user?.userType === "Faculty";

  return (
    <div className="p-6 space-y-6">

      {/* ── Profile incomplete alert ── */}
      {!user?.profileComplete && (
        <div className="flex items-start gap-3 bg-yellow-400 text-yellow-900 rounded-xl px-5 py-4">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">
            <span className="font-bold">Complete your profile</span> to access full library services.{" "}
            <Link to="/create-profile" className="underline font-bold hover:text-yellow-700">
              Set up now →
            </Link>
          </p>
        </div>
      )}

      {/* ── Unpaid fine alert ── */}
      {unpaidFines.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <PhilippinePeso size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">
              You have {unpaidFines.length} unpaid fine{unpaidFines.length > 1 ? "s" : ""} — ₱{totalFine.toFixed(2)} total
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Please settle at the library counter to continue borrowing.{" "}
              <Link to="/student/borrows" className="underline font-semibold">View details →</Link>
            </p>
          </div>
        </div>
      )}

      {/* ── Welcome header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-gray-400 font-medium">{greet()},</p>
          <h1 className="text-2xl font-bold text-gray-800 leading-tight">
            {user?.fullName}
          </h1>
          <p className="text-xs text-gray-400 mt-1 capitalize">
            {isFaculty ? "Faculty" : "Student"}
            {user?.studentNumber ? ` · ${user.studentNumber}` : ""}
            {user?.userType ? ` · ${user.userType}` : ""}
          </p>
        </div>

        {/* Today's attendance badge */}
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0 ${
          todayAttended
            ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-gray-50 border border-gray-200 text-gray-500"
        }`}>
          <CalendarDays size={16} />
          {todayAttended ? "Attended today ✓" : "Not yet attended today"}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Library}
          label="Total Resources"
          value={loading ? "…" : totalBooks}
          sub={`${available} available`}
          color="bg-[#227325]"
          to="/student/books"
        />
        <StatCard
          icon={BookOpen}
          label="Active Borrows"
          value={loading ? "…" : activeBorrows.length}
          sub={overdueBorrows.length > 0 ? `${overdueBorrows.length} overdue` : "All on time"}
          color={overdueBorrows.length > 0 ? "bg-red-500" : "bg-blue-500"}
          to="/student/borrows"
        />
        <StatCard
          icon={Hourglass}
          label="Pending"
          value={loading ? "…" : pendingBorrows.length}
          sub="Awaiting approval"
          color="bg-yellow-500"
          to="/student/borrows"
        />
        <StatCard
          icon={CalendarDays}
          label="Visits This Month"
          value={loading ? "…" : attendance.filter((r) => {
            const d = new Date(r.date);
            const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length}
          sub="Library attendance"
          color="bg-purple-500"
          to="/student/qr"
        />
      </div>

      {/* ── Two-column section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Active / Overdue Borrows */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookMarked size={16} className="text-[#227325]" />
              <span className="text-sm font-bold text-gray-700">My Borrows</span>
            </div>
            <Link
              to="/student/borrows"
              className="text-xs text-[#227325] font-semibold hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight size={13} />
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 py-4 text-center">Loading...</p>
          ) : highlightBorrows.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <BookCheck size={32} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No active borrows.</p>
              <Link to="/student/books" className="text-xs text-[#227325] font-semibold hover:underline mt-1 inline-block">
                Browse catalog →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {highlightBorrows.map((b) => {
                const sm = statusMeta[b.status] || statusMeta.borrowed;
                const isOverdue = b.status === "overdue";
                return (
                  <div
                    key={b.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      isOverdue ? "border-red-100 bg-red-50/40" : "border-gray-100 bg-gray-50/50"
                    }`}
                  >
                    <CoverImage book={b.book} className="h-14 w-10 rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {b.book?.title || b.qbTitle || "—"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{b.book?.author || b.qbAuthor}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sm.color}`}>
                          {sm.label}
                        </span>
                        {b.dueDate && (
                          <span className={`text-xs ${isOverdue ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                            Due: {fmtDate(b.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    {b.fineStatus === "unpaid" && (
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold text-red-600">₱{Number(b.fineAmount).toFixed(2)}</p>
                        <p className="text-xs text-red-400">unpaid</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attendance + QR shortcut */}
        <div className="space-y-4">

          {/* QR shortcut card */}
          <Link
            to="/student/qr"
            className="bg-linear-to-br from-[#227325] to-[#1a5a1d] rounded-2xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className="p-3 bg-white/20 rounded-xl shrink-0">
              <QrCode size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">My Library QR Code</p>
              <p className="text-white/70 text-xs mt-0.5">
                Show at the entrance to log attendance
              </p>
            </div>
            <ChevronRight size={18} className="text-white/60 shrink-0" />
          </Link>

          {/* Recent attendance */}
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#227325]" />
                <span className="text-sm font-bold text-gray-700">Recent Attendance</span>
              </div>
              <Link
                to="/student/qr"
                className="text-xs text-[#227325] font-semibold hover:underline flex items-center gap-0.5"
              >
                View all <ChevronRight size={13} />
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-gray-400 py-2 text-center">Loading...</p>
            ) : recentAttendance.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <CalendarDays size={28} className="mx-auto mb-1 text-gray-200" />
                <p className="text-xs">No attendance records yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAttendance.map((r) => {
                  const isToday = r.date === todayPH();
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                        isToday ? "bg-green-50 border border-green-100" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        )}
                        <p className="text-xs font-semibold text-gray-700">
                          {new Date(r.date).toLocaleDateString("en-PH", {
                            weekday: "short", month: "short", day: "numeric",
                          })}
                          {isToday && (
                            <span className="ml-1.5 text-green-600 font-bold">· Today</span>
                          )}
                        </p>
                      </div>
                      <p className="text-xs font-medium text-green-600">{r.timeIn ?? "—"}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick links ── */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Links</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: "/student/books",   icon: Library,      label: "Browse Catalog",  color: "text-[#227325]", bg: "bg-green-50  hover:bg-green-100"  },
            { to: "/student/borrows", icon: BookOpen,     label: "My Borrows",      color: "text-blue-600",  bg: "bg-blue-50   hover:bg-blue-100"   },
            { to: "/student/qr",      icon: QrCode,       label: "My QR Code",      color: "text-purple-600",bg: "bg-purple-50 hover:bg-purple-100" },
            { to: "/student/borrows", icon: CheckCircle,  label: "Borrow History",  color: "text-gray-600",  bg: "bg-gray-50   hover:bg-gray-100"   },
          ].map(({ to, icon: Icon, label, color, bg }) => (
            <Link
              key={to + label}
              to={to}
              className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition-colors ${bg}`}
            >
              <Icon size={22} className={color} />
              <span className={`text-xs font-semibold ${color}`}>{label}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

export default StudentDashboard;
