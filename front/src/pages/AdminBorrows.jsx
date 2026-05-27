import { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, Clock, AlertTriangle, CheckCircle, PhilippinePeso, BookPlus, Zap, ChevronDown } from "lucide-react";
import { useToast } from "../context/ToastContext";
import api from "../api/axios";
import CoverImage from "../components/CoverImage";

const statusMeta = {
  pending:  { label: "Pending",  color: "bg-yellow-100 text-yellow-700" },
  borrowed: { label: "Borrowed", color: "bg-blue-100 text-blue-700"    },
  overdue:  { label: "Overdue",  color: "bg-red-100 text-red-600"      },
  returned: { label: "Returned", color: "bg-green-100 text-green-700"  },
  rejected: { label: "Rejected", color: "bg-gray-100 text-gray-500"    },
};

const AdminBorrows = () => {
  const toast = useToast();
  const [borrows, setBorrows]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch]     = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote, setRejectNote]   = useState("");

  // Quick Borrow state
  const [showQuickBorrow, setShowQuickBorrow] = useState(false);
  const [allUsers, setAllUsers]       = useState([]);
  const [qbLoading, setQbLoading]     = useState(false);
  const [qbError, setQbError]         = useState("");
  const [loanDaysMode, setLoanDaysMode] = useState("preset");
  const [qbSuggestions, setQbSuggestions] = useState([]);
  const [qbForm, setQbForm] = useState({
    title: "", author: "", category: "", publishedYear: "",
    isbn: "", shelfLocation: "", publisher: "",
    userId: "", loanDays: "7",
  });

  // Searchable user picker state
  const [userSearch, setUserSearch]         = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser]     = useState(null);
  const userPickerRef = useRef(null);

  const searchHistory = async (q) => {
    if (!q || q.length < 2) { setQbSuggestions([]); return; }
    try {
      const { data } = await api.get(`/borrows/quick/history?q=${encodeURIComponent(q)}`);
      setQbSuggestions(data.results || []);
    } catch { setQbSuggestions([]); }
  };

  const applySuggestion = (s) => {
    setQbForm(p => ({
      ...p,
      title:         s.qbTitle         || p.title,
      author:        s.qbAuthor        || p.author,
      isbn:          s.qbIsbn          || p.isbn,
      category:      s.qbCategory      || p.category,
      publisher:     s.qbPublisher     || p.publisher,
      shelfLocation: s.qbShelfLocation || p.shelfLocation,
      publishedYear: s.qbPublishedYear  ? String(s.qbPublishedYear) : p.publishedYear,
    }));
    setQbSuggestions([]);
  };

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (userPickerRef.current && !userPickerRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return allUsers;
    const q = userSearch.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.studentNumber?.toLowerCase().includes(q)
    );
  }, [allUsers, userSearch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [borrowsRes, statsRes] = await Promise.all([
        api.get("/borrows"),
        api.get("/borrows/stats"),
      ]);
      setBorrows(borrowsRes.data.borrows);
      setStats(statsRes.data);
    } catch {
      setError("Failed to load borrow records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openQuickBorrow = async () => {
    setQbForm({ title: "", author: "", category: "", publishedYear: "", isbn: "", shelfLocation: "", publisher: "", userId: "", loanDays: "7" });
    setQbError("");
    setLoanDaysMode("preset");
    setQbSuggestions([]);
    setUserSearch("");
    setSelectedUser(null);
    setShowUserDropdown(false);
    if (allUsers.length === 0) {
      try {
        const { data } = await api.get("/users");
        setAllUsers(data.users);
      } catch { /* ignore */ }
    }
    setShowQuickBorrow(true);
  };

  const handleQuickBorrow = async (e) => {
    e.preventDefault();
    setQbLoading(true);
    setQbError("");
    try {
      await api.post("/borrows/quick", {
        ...qbForm,
        publishedYear: qbForm.publishedYear ? Number(qbForm.publishedYear) : undefined,
        loanDays: Number(qbForm.loanDays),
        userId: Number(qbForm.userId),
      });
      setShowQuickBorrow(false);
      toast("Quick borrow recorded successfully.");
      fetchData();
    } catch (err) {
      setQbError(err.response?.data?.message || "Quick borrow failed.");
    } finally {
      setQbLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id + "approve");
    try {
      await api.patch(`/borrows/${id}/approve`);
      toast("Borrow request approved.");
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to approve.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id + "reject");
    try {
      await api.patch(`/borrows/${rejectModal.id}/reject`, { note: rejectNote });
      setRejectModal(null);
      setRejectNote("");
      toast("Borrow request rejected.");
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to reject.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReturn = async (id) => {
    if (!confirm("Process return for this record?")) return;
    setActionLoading(id + "return");
    try {
      await api.patch(`/borrows/${id}/return`);
      toast("Book returned successfully.");
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to process return.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayFine = async (id) => {
    if (!confirm("Mark this fine as paid?")) return;
    setActionLoading(id + "pay");
    try {
      await api.patch(`/borrows/${id}/pay-fine`);
      toast("Fine marked as paid.");
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to mark fine as paid.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingList = useMemo(() => borrows.filter((b) => b.status === "pending"), [borrows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const byTab = activeTab === "all" ? borrows : borrows.filter((b) => b.status === activeTab);
    return byTab.filter((b) =>
      !q ||
      b.book?.title?.toLowerCase().includes(q) ||
      b.borrower?.fullName?.toLowerCase().includes(q) ||
      b.borrower?.email?.toLowerCase().includes(q)
    );
  }, [borrows, activeTab, search]);

  const tabs = [
    { key: "pending",  label: "Pending Requests" },
    { key: "borrowed", label: "Active Borrows"   },
    { key: "overdue",  label: "Overdue"          },
    { key: "returned", label: "Returned"         },
    { key: "all",      label: "All Records"      },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Borrow Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Approve requests, manage returns, and track fines</p>
        </div>
        <button
          onClick={openQuickBorrow}
          className="flex items-center gap-2 rounded-md bg-[#227325] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
        >
          <Zap size={15} /> Quick Borrow
        </button>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Pending",       value: stats.pending,          color: "bg-yellow-400", icon: BookPlus      },
            { label: "Active",        value: stats.totalBorrowed,    color: "bg-blue-500",   icon: Clock         },
            { label: "Overdue",       value: stats.totalOverdue,     color: "bg-red-500",    icon: AlertTriangle },
            { label: "Unpaid Fines",  value: stats.totalUnpaidFines, color: "bg-orange-500", icon: PhilippinePeso},
            { label: "Fines Paid",    value: stats.totalPaidFines,   color: "bg-green-600",  icon: CheckCircle   },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={16} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-xl font-bold text-gray-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              activeTab === t.key
                ? "border-[#227325] text-[#227325]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            {t.key === "pending" && pendingList.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-bold">
                {pendingList.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <h2 className="text-base font-semibold text-gray-800 flex-1">
            {tabs.find((t) => t.key === activeTab)?.label}
          </h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search book or borrower..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#227325] w-56"
            />
          </div>
          {search && (
            <button onClick={() => setSearch("")} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500">
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {!loading && !error && (
          <p className="text-xs text-gray-400 mb-3">Showing {filtered.length} records</p>
        )}

        {loading && <p className="text-sm text-gray-400">Loading...</p>}
        {error   && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && (
          <>
            {/* Pending cards */}
            {activeTab === "pending" && (
              <div className="space-y-3">
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <CheckCircle size={36} className="mx-auto mb-2 text-green-300" />
                    <p className="text-sm">No pending requests — all caught up!</p>
                  </div>
                )}
                {filtered.map((b) => (
                  <div key={b.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-yellow-100 bg-yellow-50">
                    <CoverImage book={b.book} className="h-16 w-12 rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{b.book?.title}</p>
                      <p className="text-xs text-gray-500">{b.book?.author} · ISBN: {b.book?.isbn || "—"}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium text-gray-700">{b.borrower?.fullName}</span>
                        {" · "}{b.borrower?.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Requested: {new Date(b.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                        {" · "}{b.loanDays}-day loan
                        {b.expiresInMinutes !== undefined && (
                          <span className={`ml-2 font-semibold ${b.expiresInMinutes < 60 ? "text-red-500" : "text-yellow-600"}`}>
                            · ⏱ Expires in {b.expiresInMinutes >= 60
                              ? `${Math.floor(b.expiresInMinutes / 60)}h ${b.expiresInMinutes % 60}m`
                              : `${b.expiresInMinutes}m`}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(b.id)}
                        disabled={actionLoading === b.id + "approve"}
                        className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        {actionLoading === b.id + "approve" ? "..." : "✓ Approve"}
                      </button>
                      <button
                        onClick={() => { setRejectModal(b); setRejectNote(""); }}
                        className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Table for other tabs */}
            {activeTab !== "pending" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Borrower</th>
                      <th className="px-4 py-3">Book</th>
                      <th className="px-4 py-3">Borrow Date</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Return Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Fine</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((b) => {
                      const sm = statusMeta[b.status] || statusMeta.borrowed;
                      const isOverdue  = b.status === "overdue";
                      const hasFine    = b.fineStatus === "unpaid" || b.fineStatus === "paid";
                      const canReturn  = b.status === "borrowed" || b.status === "overdue";
                      const canPayFine = b.fineStatus === "unpaid";

                      return (
                        <tr key={b.id} className={`hover:bg-gray-50 ${isOverdue ? "bg-red-50/30" : ""}`}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800 text-xs">{b.borrower?.fullName}</p>
                            <p className="text-gray-400 text-xs">{b.borrower?.email}</p>
                          </td>
                          <td className="px-4 py-3 text-xs max-w-[160px]">
                            <p className="truncate font-medium text-gray-700">
                              {b.book?.title || b.qbTitle || "—"}
                            </p>
                            <p className="text-gray-400">
                              {b.book?.isbn || b.qbIsbn || "—"}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{b.borrowDate || "—"}</td>
                          <td className={`px-4 py-3 text-xs font-medium ${isOverdue ? "text-red-600" : "text-gray-600"}`}>
                            {b.dueDate || "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {b.returnDate ?? <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sm.color}`}>
                              {sm.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {hasFine ? (
                              <div>
                                <p className={`font-semibold ${b.fineStatus === "unpaid" ? "text-red-600" : "text-green-700"}`}>
                                  ₱{Number(b.fineAmount).toFixed(2)}
                                </p>
                                <p className="text-gray-400">{b.overdueDays}d · {b.fineStatus}</p>
                              </div>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {canReturn && (
                                <button
                                  onClick={() => handleReturn(b.id)}
                                  disabled={actionLoading === b.id + "return"}
                                  className="px-2 py-1 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold disabled:opacity-50"
                                >
                                  Return
                                </button>
                              )}
                              {canPayFine && (
                                <button
                                  onClick={() => handlePayFine(b.id)}
                                  disabled={actionLoading === b.id + "pay"}
                                  className="px-2 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-semibold disabled:opacity-50"
                                >
                                  Paid
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-10">No records found.</p>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* Quick Borrow Modal */}
      {showQuickBorrow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Zap size={18} className="text-[#227325]" /> Quick Borrow
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Record a borrow — book info saved for future use</p>
              </div>
              <button onClick={() => setShowQuickBorrow(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5">
              <form id="qb-form" onSubmit={handleQuickBorrow} className="space-y-5">
                {qbError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{qbError}</div>
                )}

                {/* Borrower */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Borrower</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Select User <span className="text-red-400">*</span></label>
                      <div ref={userPickerRef} className="relative">
                        {/* Display box */}
                        <button
                          type="button"
                          onClick={() => { setShowUserDropdown((v) => !v); setUserSearch(""); }}
                          className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm bg-white text-left focus:outline-none transition-colors ${
                            showUserDropdown ? "border-[#227325]" : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {selectedUser ? (
                            <span className="truncate text-gray-800">
                              {selectedUser.fullName}
                              <span className="text-gray-400 ml-1">({selectedUser.email})</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">— Select borrower —</span>
                          )}
                          <div className="flex items-center gap-1 shrink-0">
                            {selectedUser && (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUser(null);
                                  setQbForm((p) => ({ ...p, userId: "" }));
                                }}
                                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.click()}
                                className="text-gray-300 hover:text-red-400 transition-colors p-0.5 rounded"
                              >
                                <X size={13} />
                              </span>
                            )}
                            <ChevronDown size={15} className={`text-gray-400 transition-transform ${showUserDropdown ? "rotate-180" : ""}`} />
                          </div>
                        </button>

                        {/* Hidden input for form validation */}
                        <input type="hidden" name="userId" value={qbForm.userId} required />

                        {/* Dropdown */}
                        {showUserDropdown && (
                          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col max-h-64">
                            {/* Search input */}
                            <div className="p-2 border-b border-gray-100 shrink-0">
                              <div className="relative">
                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  autoFocus
                                  type="text"
                                  placeholder="Search by name, email, or student no..."
                                  value={userSearch}
                                  onChange={(e) => setUserSearch(e.target.value)}
                                  className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-[#227325]"
                                />
                              </div>
                            </div>
                            {/* User list */}
                            <div className="overflow-y-auto flex-1">
                              {filteredUsers.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-4">No users found.</p>
                              ) : (
                                filteredUsers.map((u) => (
                                  <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setQbForm((p) => ({ ...p, userId: String(u.id) }));
                                      setShowUserDropdown(false);
                                      setUserSearch("");
                                    }}
                                    className={`w-full text-left px-4 py-2.5 hover:bg-green-50 border-b border-gray-50 last:border-0 transition-colors ${
                                      qbForm.userId === String(u.id) ? "bg-green-50" : ""
                                    }`}
                                  >
                                    <p className="text-sm font-medium text-gray-800 truncate">{u.fullName}</p>
                                    <p className="text-xs text-gray-400 truncate">
                                      {u.email}
                                      {u.studentNumber ? ` · ${u.studentNumber}` : ""}
                                    </p>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Validation trigger — shows native required message if no user selected on submit */}
                      {!qbForm.userId && (
                        <input
                          tabIndex={-1}
                          required
                          value=""
                          onChange={() => {}}
                          className="absolute opacity-0 w-0 h-0 pointer-events-none"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-600">Loan Period (days) <span className="text-red-400">*</span></label>
                        <div className="flex rounded-md border border-gray-300 overflow-hidden text-xs">
                          <button type="button" onClick={() => { setLoanDaysMode("preset"); setQbForm((p) => ({ ...p, loanDays: "7" })); }}
                            className={`px-2.5 py-1 font-medium transition-colors ${loanDaysMode === "preset" ? "bg-[#227325] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                            Preset
                          </button>
                          <button type="button" onClick={() => { setLoanDaysMode("custom"); setQbForm((p) => ({ ...p, loanDays: "" })); }}
                            className={`px-2.5 py-1 font-medium transition-colors border-l border-gray-300 ${loanDaysMode === "custom" ? "bg-[#227325] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                            Custom
                          </button>
                        </div>
                      </div>
                      {loanDaysMode === "preset" ? (
                        <select value={qbForm.loanDays} onChange={(e) => setQbForm((p) => ({ ...p, loanDays: e.target.value }))}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#227325] outline-none bg-white">
                          {[7, 8, 10, 14].map((d) => <option key={d} value={d}>{d} days</option>)}
                        </select>
                      ) : (
                        <input type="number" value={qbForm.loanDays} onChange={(e) => setQbForm((p) => ({ ...p, loanDays: e.target.value }))}
                          required min="1" max="365" placeholder="Enter number of days..."
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#227325] outline-none" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Book Info */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Book Information</p>

                  {/* Title with autocomplete */}
                  <div className="relative mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Title <span className="text-red-400">*</span></label>
                    <input
                      value={qbForm.title}
                      onChange={(e) => { setQbForm((p) => ({ ...p, title: e.target.value })); searchHistory(e.target.value); }}
                      required placeholder="Book title..."
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#227325] outline-none"
                    />
                    {qbSuggestions.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {qbSuggestions.map((s, i) => (
                          <button key={i} type="button" onClick={() => applySuggestion(s)}
                            className="w-full text-left px-4 py-2.5 hover:bg-green-50 border-b border-gray-100 last:border-0">
                            <p className="text-sm font-medium text-gray-800">{s.qbTitle}</p>
                            <p className="text-xs text-gray-400">{s.qbAuthor}{s.qbIsbn ? ` · ${s.qbIsbn}` : ""}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Author <span className="text-red-400">*</span></label>
                      <input value={qbForm.author} onChange={(e) => setQbForm((p) => ({ ...p, author: e.target.value }))} required placeholder="Author name..."
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#227325] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">ISBN</label>
                      <input value={qbForm.isbn} onChange={(e) => setQbForm((p) => ({ ...p, isbn: e.target.value }))} placeholder="e.g. 978-3-16-148410-0"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#227325] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                      <input value={qbForm.category} onChange={(e) => setQbForm((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Computer Science"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#227325] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Year Published</label>
                      <input type="number" value={qbForm.publishedYear} onChange={(e) => setQbForm((p) => ({ ...p, publishedYear: e.target.value }))}
                        placeholder="e.g. 2023" min="1900" max="2099"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#227325] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Shelf Location</label>
                      <input value={qbForm.shelfLocation} onChange={(e) => setQbForm((p) => ({ ...p, shelfLocation: e.target.value }))} placeholder="e.g. Section A, Row 3"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#227325] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Publisher</label>
                      <input value={qbForm.publisher} onChange={(e) => setQbForm((p) => ({ ...p, publisher: e.target.value }))} placeholder="Publisher name..."
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#227325] outline-none" />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50 rounded-b-2xl">
              <button type="button" onClick={() => setShowQuickBorrow(false)} className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
              <button type="submit" form="qb-form" disabled={qbLoading} className="rounded-md bg-[#227325] px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 shadow-sm">
                {qbLoading ? "Processing..." : "Record Borrow"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-800">Reject Borrow Request</h3>
            <p className="text-sm text-gray-500">
              Rejecting request for <span className="font-medium text-gray-700">{rejectModal.book?.title}</span> by{" "}
              <span className="font-medium text-gray-700">{rejectModal.borrower?.fullName}</span>.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Reason (optional)</label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
                placeholder="e.g. Book is reserved, please come back later..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-400 outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!!actionLoading}
                className="flex-1 rounded-md bg-red-500 hover:bg-red-600 text-white py-2 text-sm font-semibold disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBorrows;
