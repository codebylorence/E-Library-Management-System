import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Users, BookMarked, TrendingUp, CalendarDays, BarChart2 } from "lucide-react";
import api from "../api/axios";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

/* ── Stat card ── */
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value ?? "—"}</p>
    </div>
  </div>
);

/* ── Chart card wrapper ── */
const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="mb-4">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

/* ── Custom tooltip ── */
const CustomTooltip = ({ active, payload, label, unit = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}{unit}</span>
        </p>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════ */
const AdminDashboard = () => {
  const { user } = useAuth();

  const [books, setBooks]           = useState([]);
  const [userCount, setUserCount]   = useState(null);
  const [borrowStats, setBorrowStats] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [borrowChart, setBorrowChart]   = useState(null);   // { daily, weekly }
  const [attendChart, setAttendChart]   = useState(null);   // { hourly, monthly }
  const [borrowView, setBorrowView]     = useState("daily"); // "daily" | "weekly"
  const [attendView, setAttendView]     = useState("monthly"); // "hourly" | "monthly"
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/books"),
      api.get("/users"),
      api.get("/borrows/stats"),
      api.get("/attendance/stats"),
      api.get("/borrows/chart"),
      api.get("/attendance/chart"),
    ]).then(([booksRes, usersRes, borrowStatsRes, attendStatsRes, borrowChartRes, attendChartRes]) => {
      setBooks(booksRes.data.books);
      setUserCount(usersRes.data.users.length);
      setBorrowStats(borrowStatsRes.data);
      setAttendanceStats(attendStatsRes.data);
      setBorrowChart(borrowChartRes.data);
      setAttendChart(attendChartRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const available   = books.filter((b) => b.status === "available").length;
  const unavailable = books.filter((b) => b.status === "unavailable").length;

  const ViewToggle = ({ value, onChange, options }) => (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 font-medium transition-colors ${
            value === o.value
              ? "bg-[#227325] text-white"
              : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.fullName}</h1>
        <p className="text-sm text-gray-500 mt-1 capitalize">{user?.role} · E-Library Management System</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen}    label="Total Books"      value={loading ? "..." : books.length}             color="bg-[#227325]"  />
        <StatCard icon={BookMarked}  label="Active Borrows"   value={loading ? "..." : borrowStats?.totalBorrowed ?? "—"} color="bg-blue-500"   />
        <StatCard icon={TrendingUp}  label="Overdue"          value={loading ? "..." : borrowStats?.totalOverdue ?? "—"}  color="bg-red-500"    />
        <StatCard icon={Users}       label="Registered Users" value={loading ? "..." : userCount}                color="bg-purple-500" />
      </div>

      {/* Second row stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={CalendarDays} label="Today's Visitors"  value={loading ? "..." : attendanceStats?.todayTotal ?? "—"} color="bg-teal-500"   />
        <StatCard icon={BarChart2}    label="Pending Requests"  value={loading ? "..." : borrowStats?.pending ?? "—"}        color="bg-yellow-500" />
        <StatCard icon={BookOpen}     label="Available Books"   value={loading ? "..." : available}                          color="bg-emerald-500"/>
      </div>

      {/* Charts row 1 — Borrow Activity */}
      <ChartCard
        title="Borrow Activity"
        subtitle={borrowView === "daily" ? "Borrows per day — last 7 days" : "Borrows per week — last 4 weeks"}
      >
        <div className="flex items-center justify-between mb-4">
          <span />
          <ViewToggle
            value={borrowView}
            onChange={setBorrowView}
            options={[{ value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }]}
          />
        </div>
        {loading ? (
          <div className="h-56 flex items-center justify-center text-gray-300 text-sm">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={borrowView === "daily" ? borrowChart?.daily : borrowChart?.weekly}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="borrowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#227325" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#227325" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey={borrowView === "daily" ? "date" : "week"}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="borrows"
                name="Borrows"
                stroke="#227325"
                strokeWidth={2.5}
                fill="url(#borrowGrad)"
                dot={{ r: 4, fill: "#227325", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Charts row 2 — Attendance Analytics */}
      <ChartCard
        title="Attendance Analytics"
        subtitle={attendView === "hourly" ? "Visitors by hour — today" : "Daily visitors — last 30 days"}
      >
        <div className="flex items-center justify-between mb-4">
          <span />
          <ViewToggle
            value={attendView}
            onChange={setAttendView}
            options={[{ value: "monthly", label: "Monthly" }, { value: "hourly", label: "Today" }]}
          />
        </div>
        {loading ? (
          <div className="h-56 flex items-center justify-center text-gray-300 text-sm">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={attendView === "hourly" ? attendChart?.hourly : attendChart?.monthly}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey={attendView === "hourly" ? "hour" : "date"}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                interval={attendView === "monthly" ? 4 : 0}
              />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="visitors"
                name="Visitors"
                fill="#0ea5e9"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Recent Books */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Books</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="pb-3 pr-4">Title</th>
                  <th className="pb-3 pr-4">Author</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {books.slice(0, 6).map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-800">{book.title}</td>
                    <td className="py-3 pr-4 text-gray-500">{book.author}</td>
                    <td className="py-3 pr-4 text-gray-500">{book.category}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        book.status === "available"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        {book.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {books.length === 0 && <p className="text-sm text-gray-400 mt-4">No books found.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
