import { useState, useEffect, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import {
  CalendarDays,
  Clock,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  X,
} from "lucide-react";
import api from "../api/axios";

/* ─── helpers ──────────────────────────────────────────────── */
const PAD = (n) => String(n).padStart(2, "0");

const formatTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${PAD(m)} ${ampm}`;
};

/* status → FullCalendar event color */
const STATUS_FC_COLOR = {
  pending:   { backgroundColor: "#facc15", borderColor: "#eab308", textColor: "#713f12" },
  approved:  { backgroundColor: "#22c55e", borderColor: "#16a34a", textColor: "#fff"    },
  rejected:  { backgroundColor: "#f87171", borderColor: "#ef4444", textColor: "#fff"    },
  cancelled: { backgroundColor: "#9ca3af", borderColor: "#6b7280", textColor: "#fff"    },
  completed: { backgroundColor: "#60a5fa", borderColor: "#3b82f6", textColor: "#fff"    },
};

const STATUS_BADGE = {
  pending:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved:  "bg-green-100  text-green-700  border-green-200",
  rejected:  "bg-red-100    text-red-600    border-red-200",
  cancelled: "bg-gray-100   text-gray-500   border-gray-200",
  completed: "bg-blue-100   text-blue-700   border-blue-200",
};

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize border ${STATUS_BADGE[status] ?? "bg-gray-100 text-gray-500"}`}>
    {status}
  </span>
);

/* ─── Detail Modal ─────────────────────────────────────────── */
const DetailModal = ({ reservation: r, onClose, onApprove, onReject, actionLoading }) => {
  const [note, setNote] = useState("");

  useEffect(() => { setNote(""); }, [r]);

  if (!r) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Reservation Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Requester */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#227325]/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-[#227325]">
                {r.requester?.fullName?.charAt(0) ?? "?"}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{r.requester?.fullName ?? "—"}</p>
              <p className="text-xs text-gray-400">{r.requester?.email ?? "—"}</p>
              <p className="text-xs text-gray-400 capitalize">{r.requester?.role ?? "—"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                <CalendarDays size={12} /> Date
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {new Date(r.reservationDate + "T00:00:00").toLocaleDateString("en-PH", {
                  weekday: "short", month: "short", day: "numeric", year: "numeric",
                })}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                <Clock size={12} /> Time
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {formatTime(r.startTime)} – {formatTime(r.endTime)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                <Users size={12} /> Attendees
              </p>
              <p className="text-sm font-semibold text-gray-800">{r.attendees}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Status</p>
              <StatusBadge status={r.status} />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <FileText size={12} /> Purpose
            </p>
            <p className="text-sm text-gray-700">{r.purpose}</p>
          </div>

          {r.adminNote && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-xs text-blue-400 mb-1">Admin Note</p>
              <p className="text-sm text-blue-700">{r.adminNote}</p>
            </div>
          )}

          {r.status === "pending" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Note for requester (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="e.g. Please confirm attendance count..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#227325]/30 focus:border-[#227325] resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {r.status === "pending" && (
          <div className="flex gap-3 px-6 pb-5">
            <button
              onClick={() => onReject(r.id, note)}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
              Reject
            </button>
            <button
              onClick={() => onApprove(r.id, note)}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#227325] rounded-xl hover:bg-[#1a5a1d] disabled:opacity-50 transition-colors"
            >
              {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Main Page ────────────────────────────────────────────── */
const AdminReservations = () => {
  const calendarRef = useRef(null);

  const [reservations,  setReservations]  = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [selected,      setSelected]      = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast,         setToast]         = useState({ msg: "", type: "success" });

  /* fetch all reservations (no month filter — FullCalendar handles navigation) */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, statsRes] = await Promise.all([
        api.get("/reservations"),
        api.get("/reservations/stats"),
      ]);
      setReservations(resRes.data.reservations);
      setStats(statsRes.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* auto-dismiss toast */
  useEffect(() => {
    if (!toast.msg) return;
    const t = setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  /* approve */
  const handleApprove = async (id, note) => {
    setActionLoading(true);
    try {
      await api.patch(`/reservations/${id}/approve`, { note });
      showToast("Reservation approved.");
      setSelected(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  /* reject */
  const handleReject = async (id, note) => {
    setActionLoading(true);
    try {
      await api.patch(`/reservations/${id}/reject`, { note });
      showToast("Reservation rejected.", "error");
      setSelected(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  /* convert reservations → FullCalendar events */
  const events = reservations.map((r) => {
    const colors = STATUS_FC_COLOR[r.status] ?? STATUS_FC_COLOR.pending;
    return {
      id:    String(r.id),
      title: `${r.requester?.fullName?.split(" ")[0] ?? "?"} — ${formatTime(r.startTime)}`,
      start: `${r.reservationDate}T${r.startTime}`,
      end:   `${r.reservationDate}T${r.endTime}`,
      extendedProps: { reservation: r },
      ...colors,
    };
  });

  /* click event → open modal */
  const handleEventClick = ({ event }) => {
    setSelected(event.extendedProps.reservation);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 text-sm px-4 py-3 rounded-xl shadow-lg ${
          toast.type === "error"
            ? "bg-red-600 text-white"
            : "bg-gray-800 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Detail Modal */}
      <DetailModal
        reservation={selected}
        onClose={() => setSelected(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        actionLoading={actionLoading}
      />

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Library Reservations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage and monitor faculty library reservations. Click any event to review.
        </p>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Pending",   value: stats.pending,   color: "text-yellow-600 bg-yellow-50 border-yellow-100" },
            { label: "Approved",  value: stats.approved,  color: "text-green-600  bg-green-50  border-green-100"  },
            { label: "Completed", value: stats.completed, color: "text-blue-600   bg-blue-50   border-blue-100"   },
            { label: "Rejected",  value: stats.rejected,  color: "text-red-600    bg-red-50    border-red-100"    },
            { label: "Cancelled", value: stats.cancelled, color: "text-gray-500   bg-gray-50   border-gray-100"   },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border px-4 py-3 ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* FullCalendar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <Loader2 size={28} className="animate-spin mr-2" /> Loading reservations...
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left:   "prev,next today",
              center: "title",
              right:  "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
            }}
            buttonText={{
              today:       "Today",
              month:       "Month",
              week:        "Week",
              day:         "Day",
              list:        "List",
            }}
            events={events}
            eventClick={handleEventClick}
            eventDisplay="block"
            dayMaxEvents={3}
            height="auto"
            nowIndicator={true}
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5],
              startTime:  "07:00",
              endTime:    "18:00",
            }}
            slotMinTime="07:00:00"
            slotMaxTime="19:00:00"
            eventTimeFormat={{
              hour:   "numeric",
              minute: "2-digit",
              meridiem: "short",
            }}
            /* Style overrides via className on the wrapper */
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 flex-wrap text-xs text-gray-500">
        <span className="font-medium text-gray-600">Legend:</span>
        {Object.entries(STATUS_FC_COLOR).map(([s, c]) => (
          <span key={s} className="flex items-center gap-1.5 capitalize">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.backgroundColor }} />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AdminReservations;
