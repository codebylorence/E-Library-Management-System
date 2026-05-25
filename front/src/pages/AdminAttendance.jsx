import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode, Search, X, Users, CalendarDays,
  ScanLine, ChevronLeft, ChevronRight, CheckCircle, AlertCircle,
} from "lucide-react";
import api from "../api/axios";

/* ─────────────────────────────────────────────────────────
   Beep sounds — builds a WAV in memory and plays it via
   HTMLAudioElement + Blob URL. Works without user gesture.
───────────────────────────────────────────────────────── */

const playBeep = (frequency = 900, duration = 0.35, volume = 0.8) => {
  try {
    const sampleRate = 8000;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer     = new ArrayBuffer(44 + numSamples);
    const view       = new DataView(buffer);

    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeStr(0, "RIFF");
    view.setUint32(4,  36 + numSamples, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1,  true);
    view.setUint16(22, 1,  true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate, true);
    view.setUint16(32, 1,  true);
    view.setUint16(34, 8,  true);
    writeStr(36, "data");
    view.setUint32(40, numSamples, true);

    for (let i = 0; i < numSamples; i++) {
      const t        = i / sampleRate;
      const envelope = 1 - t / duration;
      const sample   = Math.sin(2 * Math.PI * frequency * t) * envelope;
      view.setUint8(44 + i, Math.floor((sample * 0.5 + 0.5) * 255));
    }

    const blob = new Blob([buffer], { type: "audio/wav" });
    const url  = URL.createObjectURL(blob);
    const beep = new Audio(url);
    beep.volume = volume;
    beep.play().catch(() => {});
    beep.onended = () => URL.revokeObjectURL(url);
  } catch { /* silent fallback */ }
};

// High double-beep = success (new attendance recorded)
const playSuccessBeep  = () => { playBeep(900, 0.18); setTimeout(() => playBeep(1200, 0.18), 200); };
// Low single-beep = already recorded today
const playWarningBeep  = () => { playBeep(400, 0.4); };

/* ─────────────────────────────────────────────────────────
   Always-on QR Scanner — mounts camera immediately,
   stays live for the whole shift.
───────────────────────────────────────────────────────── */
const QRScanner = ({ onScan, onError }) => {
  const divId = "qr-reader";

  useEffect(() => {
    const scanner = new Html5Qrcode(divId);

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 240, height: 240 } },
        (decoded) => onScan(decoded),
        () => {}          // suppress per-frame noise
      )
      .catch((err) => onError(err?.message || "Camera unavailable"));

    return () => {
      scanner.isScanning && scanner.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        id={divId}
        className="w-full rounded-xl overflow-hidden border-2 border-[#227325]/30 bg-black"
      />
      <p className="text-xs text-gray-400 flex items-center gap-1">
        <ScanLine size={13} /> Point student QR at the camera
      </p>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────── */
const todayPH = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

const AdminAttendance = () => {
  /* stats */
  const [stats, setStats] = useState(null);

  /* records table */
  const [records, setRecords]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loadingRec, setLoadingRec] = useState(true);
  const [recError, setRecError] = useState("");
  const [search, setSearch]     = useState("");
  const [dateFrom, setDateFrom] = useState(todayPH);
  const [dateTo, setDateTo]     = useState(todayPH);

  /* scanner feedback */
  const [scanResult, setScanResult]       = useState(null);
  const [scanDuplicate, setScanDuplicate] = useState(null); // already recorded today
  const [scanError, setScanError]         = useState("");
  const [scanLoading, setScanLoading]     = useState(false);
  const [camError, setCamError]           = useState("");
  const scanCooldown = useRef(false);

  const LIMIT = 20;

  /* ── data fetchers ── */
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

  /* ── QR detected ── */
  const handleQRDetected = useCallback(async (payload) => {
    if (scanCooldown.current || scanLoading) return;
    scanCooldown.current = true;
    setTimeout(() => { scanCooldown.current = false; }, 3000);

    setScanError("");
    setScanResult(null);
    setScanDuplicate(null);
    setScanLoading(true);

    try {
      const { data } = await api.post("/attendance/scan", { payload });
      setScanResult(data);
      playSuccessBeep();
      fetchStats();
      fetchRecords();
      setTimeout(() => setScanResult(null), 5000);
    } catch (err) {
      const data = err.response?.data;
      if (data?.alreadyRecorded) {
        playWarningBeep();
        setScanDuplicate(data);
        setTimeout(() => setScanDuplicate(null), 5000);
      } else {
        setScanError(data?.message || "Scan failed.");
        setTimeout(() => setScanError(""), 5000);
      }
    } finally {
      setScanLoading(false);
    }
  }, [scanLoading, fetchStats, fetchRecords]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Attendance</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Camera is always active — students just show their QR code
        </p>
      </div>

      {/* ── Stat cards ── */}
      {stats && (
        <div className="grid grid-cols-1 gap-3">
          {[
            { label: "Today's Visits", value: stats.todayTotal, color: "bg-[#227325]", icon: CalendarDays },
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

      {/* ── Two-column layout: scanner left, table right ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5 items-start">

        {/* ── Left: live scanner panel ── */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4 sticky top-6">
          <div className="flex items-center gap-2">
            <QrCode size={17} className="text-[#227325]" />
            <span className="text-sm font-bold text-gray-700">Live Scanner</span>
            <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
              Active
            </span>
          </div>

          {/* Camera */}
          {camError ? (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-6 text-center text-sm text-red-600 space-y-1">
              <AlertCircle size={28} className="mx-auto text-red-400" />
              <p className="font-semibold">Camera unavailable</p>
              <p className="text-xs text-red-400">{camError}</p>
              <p className="text-xs text-gray-400 mt-1">
                Allow camera access in your browser and reload.
              </p>
            </div>
          ) : (
            <QRScanner onScan={handleQRDetected} onError={setCamError} />
          )}

          {/* Feedback area */}
          <div className="min-h-[72px]">
            {scanLoading && (
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-4 text-center text-sm text-gray-500">
                Processing...
              </div>
            )}

            {scanError && !scanLoading && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2 text-sm text-red-600">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {scanError}
              </div>
            )}

            {scanDuplicate && !scanLoading && (
              <div className="rounded-xl bg-yellow-50 border border-yellow-300 px-4 py-4 space-y-1">
                <div className="flex items-center gap-2">
                  <AlertCircle size={17} className="text-yellow-500 shrink-0" />
                  <span className="text-sm font-bold text-yellow-700">Already Recorded Today</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {scanDuplicate.student?.fullName}
                </p>
                {scanDuplicate.student?.studentNumber && (
                  <p className="text-xs text-gray-500">{scanDuplicate.student.studentNumber}</p>
                )}
                <p className="text-xs text-yellow-600">This student has already logged attendance for today.</p>
              </div>
            )}

            {scanResult && !scanLoading && (
              <div className="rounded-xl border px-4 py-4 space-y-1 bg-green-50 border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle size={17} className="text-green-600" />
                  <span className="text-sm font-bold text-green-700">✓ Attendance Recorded</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {scanResult.student?.fullName}
                </p>
                {scanResult.student?.studentNumber && (
                  <p className="text-xs text-gray-500">{scanResult.student.studentNumber}</p>
                )}
              </div>
            )}

            {!scanLoading && !scanError && !scanResult && !scanDuplicate && (
              <div className="rounded-xl bg-gray-50 border border-dashed border-gray-200 px-4 py-4 text-center text-xs text-gray-400">
                Waiting for QR scan...
              </div>
            )}
          </div>
        </div>

        {/* ── Right: records table ── */}
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
            <p className="text-xs text-gray-400">
              Showing {records.length} of {total} records
            </p>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="text-xs text-gray-500">
                    Page {page} of {totalPages}
                  </span>
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
    </div>
  );
};

export default AdminAttendance;
