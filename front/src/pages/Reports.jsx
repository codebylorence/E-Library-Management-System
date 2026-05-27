import { useState, useEffect, useCallback } from "react";
import {
  Printer, FileText, BookOpen,
  CalendarDays, Loader2, Search, X,
} from "lucide-react";
import api from "../api/axios";
import cvsuLogo from "../assets/CvSU-Logo.webp";

/* ─── helpers ──────────────────────────────────────────── */
const todayPH = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";
const fmtCurrency = (n) => n != null ? `₱${Number(n).toFixed(2)}` : "—";

const STATUS_COLORS = {
  pending:    "bg-yellow-100 text-yellow-700",
  borrowed:   "bg-blue-100   text-blue-700",
  overdue:    "bg-red-100    text-red-700",
  returned:   "bg-green-100  text-green-700",
  rejected:   "bg-gray-100   text-gray-500",
  available:  "bg-green-100  text-green-700",
  unavailable:"bg-red-100    text-red-700",
};

/* ─── Print styles ──────────────────────────────────────── */
const PRINT_STYLE = `
@media print {
  body * { visibility: hidden !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: fixed; inset: 0; padding: 24px; background: white; }
  .no-print { display: none !important; }
  table { border-collapse: collapse; width: 100%; font-size: 11px; }
  th, td { border: 1px solid #d1d5db; padding: 5px 8px; text-align: left; }
  th { background: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .status-badge { padding: 1px 6px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
}
`;

/* ─── Print Header ──────────────────────────────────────── */
const PrintHeader = ({ title, subtitle, filters }) => (
  <div className="hidden print:block mb-6">
    <div className="flex items-center gap-4 border-b-2 border-gray-800 pb-4 mb-4">
      <img src={cvsuLogo} alt="CvSU" className="w-14 h-14 object-contain" />
      <div>
        <p className="text-xs text-gray-500 font-medium">Cavite State University — Carmona Campus</p>
        <h1 className="text-xl font-bold text-gray-900">Library Management System</h1>
        <h2 className="text-base font-semibold text-gray-700">{title}</h2>
      </div>
    </div>
    {subtitle && <p className="text-xs text-gray-500 mb-1">{subtitle}</p>}
    {filters  && <p className="text-xs text-gray-400 italic">{filters}</p>}
    <p className="text-xs text-gray-400 mt-1">
      Generated: {new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })}
    </p>
  </div>
);

/* ─── Tab Button ────────────────────────────────────────── */
const Tab = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      active ? "bg-[#227325] text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"
    }`}
  >
    <Icon size={15} /> {label}
  </button>
);

/* ══════════════════════════════════════════════════════════
   ATTENDANCE REPORT
══════════════════════════════════════════════════════════ */
const AttendanceReport = () => {
  const today = todayPH();
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo,   setDateTo]   = useState(today);
  const [search,   setSearch]   = useState("");
  const [records,  setRecords]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: 1000, page: 1,
        ...(dateFrom && { dateFrom }),
        ...(dateTo   && { dateTo   }),
        ...(search   && { search   }),
      });
      const { data } = await api.get(`/attendance?${params}`);
      setRecords(data.records);
      setTotal(data.total);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [dateFrom, dateTo, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const filterLabel = `Date: ${fmtDate(dateFrom)} – ${fmtDate(dateTo)}${search ? ` | Search: "${search}"` : ""}`;

  return (
    <div>
      <div className="no-print flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">From</label>
          <input type="date" value={dateFrom} max={dateTo} onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#227325]" />
          <label className="text-xs text-gray-500 font-medium">To</label>
          <input type="date" value={dateTo} min={dateFrom} onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#227325]" />
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search student..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#227325] w-44" />
        </div>
        {(search || dateFrom !== today || dateTo !== today) && (
          <button onClick={() => { setSearch(""); setDateFrom(today); setDateTo(today); }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500">
            <X size={12} /> Reset
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{total} record{total !== 1 ? "s" : ""}</span>
      </div>

      <div id="print-area">
        <PrintHeader title="Attendance Report" subtitle={`Total Records: ${total}`} filters={filterLabel} />
        {loading ? (
          <div className="no-print flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={22} className="animate-spin mr-2" /> Loading...
          </div>
        ) : (
          <table className="w-full text-sm text-left border border-gray-100 rounded-xl overflow-hidden">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Student No.</th>
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r, i) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 text-xs">{r.student?.fullName}</p>
                    <p className="text-gray-400 text-xs">{r.student?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.student?.studentNumber || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.student?.program || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{fmtDate(r.date)}</td>
                  <td className="px-4 py-3 text-xs font-medium text-green-600">{r.timeIn ?? "—"}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">No records found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   BORROWING REPORT
══════════════════════════════════════════════════════════ */
const BorrowReport = () => {
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search,       setSearch]       = useState("");
  const [records,      setRecords]      = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const { data } = await api.get(`/borrows?${params}`);
      let rows = data.borrows ?? [];

      if (dateFrom) rows = rows.filter((r) => r.borrowDate && r.borrowDate >= dateFrom);
      if (dateTo)   rows = rows.filter((r) => r.borrowDate && r.borrowDate <= dateTo);
      if (search) {
        const q = search.toLowerCase();
        rows = rows.filter((r) =>
          r.borrower?.fullName?.toLowerCase().includes(q) ||
          r.borrower?.studentNumber?.toLowerCase().includes(q) ||
          (r.book?.title || r.qbTitle || "").toLowerCase().includes(q)
        );
      }
      setRecords(rows);
      setTotal(rows.length);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [dateFrom, dateTo, statusFilter, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const bookTitle  = (r) => r.book?.title  || r.qbTitle  || "—";
  const bookAuthor = (r) => r.book?.author || r.qbAuthor || "—";

  const filterLabel = [
    statusFilter !== "all" ? `Status: ${statusFilter}` : "",
    dateFrom ? `From: ${fmtDate(dateFrom)}` : "",
    dateTo   ? `To: ${fmtDate(dateTo)}`     : "",
    search   ? `Search: "${search}"`        : "",
  ].filter(Boolean).join(" | ") || "All records";

  return (
    <div>
      <div className="no-print flex flex-wrap items-center gap-3 mb-5">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#227325]">
          <option value="all">All Statuses</option>
          {["pending","borrowed","overdue","returned","rejected"].map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">From</label>
          <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#227325]" />
          <label className="text-xs text-gray-500 font-medium">To</label>
          <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#227325]" />
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search borrower / book..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#227325] w-48" />
        </div>
        {(search || dateFrom || dateTo || statusFilter !== "all") && (
          <button onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setStatusFilter("all"); }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500">
            <X size={12} /> Reset
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{total} record{total !== 1 ? "s" : ""}</span>
      </div>

      <div id="print-area">
        <PrintHeader title="Borrowing Records Report" subtitle={`Total Records: ${total}`} filters={filterLabel} />
        {loading ? (
          <div className="no-print flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={22} className="animate-spin mr-2" /> Loading...
          </div>
        ) : (
          <table className="w-full text-sm text-left border border-gray-100 rounded-xl overflow-hidden">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Borrower</th>
                <th className="px-4 py-3">Book / Title</th>
                <th className="px-4 py-3">Borrow Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Return Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Fine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r, i) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 text-xs">{r.borrower?.fullName ?? "—"}</p>
                    <p className="text-gray-400 text-xs">{r.borrower?.studentNumber ?? r.borrower?.email ?? ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 text-xs">{bookTitle(r)}</p>
                    <p className="text-gray-400 text-xs">{bookAuthor(r)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{fmtDate(r.borrowDate)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{fmtDate(r.dueDate)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{fmtDate(r.returnDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`status-badge px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {r.fineAmount > 0 ? (
                      <span className={r.fineStatus === "paid" ? "text-green-600" : "text-red-600"}>
                        {fmtCurrency(r.fineAmount)} ({r.fineStatus})
                      </span>
                    ) : "—"}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">No records found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   BOOKS REPORT
══════════════════════════════════════════════════════════ */
const BooksReport = () => {
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search,       setSearch]       = useState("");
  const [books,        setBooks]        = useState([]);
  const [loading,      setLoading]      = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/books");
      setBooks(data.books ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = books.filter((b) => {
    const matchType   = typeFilter   === "all" || b.materialType === typeFilter;
    const matchStatus = statusFilter === "all" || b.status       === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.isbn?.toLowerCase().includes(q);
    return matchType && matchStatus && matchSearch;
  });

  const TYPES = ["Library Books","E-Books","E-Journals","Thesis / Dissertation","Magazine / Article"];

  const filterLabel = [
    typeFilter   !== "all" ? `Type: ${typeFilter}`     : "",
    statusFilter !== "all" ? `Status: ${statusFilter}` : "",
    search ? `Search: "${search}"` : "",
  ].filter(Boolean).join(" | ") || "All resources";

  return (
    <div>
      <div className="no-print flex flex-wrap items-center gap-3 mb-5">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#227325]">
          <option value="all">All Types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#227325]">
          <option value="all">All Statuses</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search title / author / ISBN..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#227325] w-52" />
        </div>
        {(search || typeFilter !== "all" || statusFilter !== "all") && (
          <button onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500">
            <X size={12} /> Reset
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} resource{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div id="print-area">
        <PrintHeader title="Library Resources Report" subtitle={`Total Resources: ${filtered.length}`} filters={filterLabel} />
        {loading ? (
          <div className="no-print flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={22} className="animate-spin mr-2" /> Loading...
          </div>
        ) : (
          <table className="w-full text-sm text-left border border-gray-100 rounded-xl overflow-hidden">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">ISBN / ISSN</th>
                <th className="px-4 py-3">Copies</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((b, i) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 text-xs">{b.title}</p>
                    {b.shelfLocation && <p className="text-gray-400 text-xs">Shelf: {b.shelfLocation}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{b.author}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{b.materialType}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{b.category}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{b.publishedYear}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{b.isbn || b.issn || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {b.quantity != null ? `${b.availableCopies} / ${b.quantity}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`status-badge px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">No resources found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN REPORTS PAGE
══════════════════════════════════════════════════════════ */
const TABS = [
  { key: "attendance", label: "Attendance",        icon: CalendarDays },
  { key: "borrows",    label: "Borrowing Records",  icon: BookOpen     },
  { key: "books",      label: "Books & Resources",  icon: FileText     },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState("attendance");

  useEffect(() => {
    const id = "report-print-style";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = PRINT_STYLE;
      document.head.appendChild(style);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  const tabLabel = TABS.find((t) => t.key === activeTab)?.label ?? "";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and print reports for library records.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="no-print flex items-center gap-2 bg-[#227325] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1a5a1d] transition-colors shadow-sm"
        >
          <Printer size={16} /> Print {tabLabel}
        </button>
      </div>

      {/* Tabs */}
      <div className="no-print flex items-center gap-2 bg-gray-100 rounded-2xl p-1.5 w-fit">
        {TABS.map((t) => (
          <Tab key={t.key} active={activeTab === t.key} onClick={() => setActiveTab(t.key)} icon={t.icon} label={t.label} />
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {activeTab === "attendance" && <AttendanceReport />}
        {activeTab === "borrows"    && <BorrowReport    />}
        {activeTab === "books"      && <BooksReport     />}
      </div>
    </div>
  );
};

export default Reports;
