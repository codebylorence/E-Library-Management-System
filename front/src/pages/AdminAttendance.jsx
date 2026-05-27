import { useState, useEffect, useCallback } from "react";
import {
  Search, X, Users, CalendarDays,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import api from "../api/axios";

const todayPH = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

const AdminAttendance = () => {
  const [stats, setStats] = useState(null);

  const [records,    setRecords]    = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [loadingRec, setLoadingRec] = useState(true);
  const [recError,   setRecError]   = useState("");
  const [search,     setSearch]     = useState("");
  const [dateFrom,   setDateFrom]   = useState(todayPH);
  const [dateTo,     setDateTo]     = useState(todayPH);

  const LIMIT = 20;

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get("/attendance/stats");
      setStats(data);
    } catch { /* silent */ }
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoadingRec(true);
    try {
      const params = new URLSearchParams({
        page, limit: LIMIT,
        ...(dateFrom && { dateFrom }),
        ...(dateTo   && { dateTo   }),
        ...(search   && { search   }),
      });
      const { data } = await api.get(`/attendance?${params}`);
      setRecords(data.records);
      setTotal(data.total);
    } catch {
      setRecError("Failed to load records.");
    } finally {
      setLoadingRec(false);
    }
  }, [page, dateFrom, dateTo, search]);

  useEffect(() => { fetchStats(); fetchRecords(); }, [fetchStats, fetchRecords]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Attendance</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Library visit records. Use the kiosk at the entrance to scan QR codes.
        </p>
      </div>

      {/* Stat card */}
      {stats && (
        <div className="inline-flex items-center gap-3 bg-white rounded-xl shadow-sm px-5 py-4">
          <div className="p-2 rounded-lg bg-[#227325]">
            <CalendarDays size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Today's Visits</p>
            <p className="text-2xl font-bold text-gray-800">{stats.todayTotal}</p>
          </div>
        </div>
      )}

      {/* Records table */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold text-gray-800 flex-1">Attendance Records</h2>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">From</label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#227325]"
            />
            <label className="text-xs text-gray-500 font-medium">To</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#227325]"
            />
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#227325] w-44"
            />
          </div>

          {(search || dateFrom !== todayPH || dateTo !== todayPH) && (
            <button
              onClick={() => { setSearch(""); setDateFrom(todayPH); setDateTo(todayPH); setPage(1); }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500"
            >
              <X size={13} /> Reset
            </button>
          )}
        </div>

        {!loadingRec && !recError && (
          <p className="text-xs text-gray-400">Showing {records.length} of {total} records</p>
        )}

        {loadingRec && <p className="text-sm text-gray-400">Loading...</p>}
        {recError   && <p className="text-sm text-red-500">{recError}</p>}

        {!loadingRec && !recError && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Student No.</th>
                    <th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time In</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 text-xs">{r.student?.fullName}</p>
                        <p className="text-gray-400 text-xs">{r.student?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {r.student?.studentNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {r.student?.program || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {new Date(r.date).toLocaleDateString("en-PH", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-green-600">
                        {r.timeIn ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {records.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Users size={36} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">No attendance records found.</p>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default AdminAttendance;
