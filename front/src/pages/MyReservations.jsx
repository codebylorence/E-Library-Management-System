import { useState, useEffect } from "react";
import { CalendarDays, Clock, Users, FileText, Plus, X, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import api from "../api/axios";

/* ── Status badge ── */
const StatusBadge = ({ status }) => {
  const map = {
    pending:   "bg-yellow-100 text-yellow-700",
    approved:  "bg-green-100 text-green-700",
    rejected:  "bg-red-100 text-red-600",
    cancelled: "bg-gray-100 text-gray-500",
    completed: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
};

/* ── Status icon ── */
const StatusIcon = ({ status }) => {
  if (status === "approved")  return <CheckCircle size={16} className="text-green-500" />;
  if (status === "rejected")  return <XCircle     size={16} className="text-red-500"   />;
  if (status === "pending")   return <AlertCircle size={16} className="text-yellow-500"/>;
  return null;
};

/* ── Time slot options ── */
const TIME_SLOTS = [
  "07:00","07:30","08:00","08:30","09:00","09:30",
  "10:00","10:30","11:00","11:30","12:00","12:30",
  "13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30","18:00",
];

const formatTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const formatDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-PH", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });

/* ══════════════════════════════════════════════ */
const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

  const [form, setForm] = useState({
    reservationDate: "",
    startTime: "",
    endTime: "",
    purpose: "",
    attendees: 1,
  });

  const fetchReservations = async () => {
    try {
      const res = await api.get("/reservations/my");
      setReservations(res.data.reservations);
    } catch {
      // silently fail on refresh
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservations(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await api.post("/reservations", { ...form, attendees: Number(form.attendees) });
      setSuccess("Reservation submitted! The librarian will review your request.");
      setShowForm(false);
      setForm({ reservationDate: "", startTime: "", endTime: "", purpose: "", attendees: 1 });
      fetchReservations();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit reservation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this reservation?")) return;
    setCancellingId(id);
    try {
      await api.patch(`/reservations/${id}/cancel`);
      setSuccess("Reservation cancelled.");
      fetchReservations();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel.");
    } finally {
      setCancellingId(null);
    }
  };

  // Filter end times to only show options after selected start time
  const endTimeOptions = form.startTime
    ? TIME_SLOTS.filter((t) => t > form.startTime)
    : TIME_SLOTS;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Library Reservations</h1>
          <p className="text-sm text-gray-500 mt-1">Reserve the library for classes, meetings, or events.</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setError(""); setSuccess(""); }}
          className="flex items-center gap-2 bg-[#227325] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a5a1d] transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Close" : "New Reservation"}
        </button>
      </div>

      {/* Alerts */}
      {error   && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{success}</div>}

      {/* Reservation Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">New Reservation Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <CalendarDays size={14} className="inline mr-1" />
                Reservation Date
              </label>
              <input
                type="date"
                name="reservationDate"
                min={today}
                value={form.reservationDate}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#227325]/30 focus:border-[#227325]"
              />
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock size={14} className="inline mr-1" />
                  Start Time
                </label>
                <select
                  name="startTime"
                  value={form.startTime}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, startTime: e.target.value, endTime: "" }));
                  }}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#227325]/30 focus:border-[#227325]"
                >
                  <option value="">Select time</option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{formatTime(t)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock size={14} className="inline mr-1" />
                  End Time
                </label>
                <select
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  required
                  disabled={!form.startTime}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#227325]/30 focus:border-[#227325] disabled:opacity-50"
                >
                  <option value="">Select time</option>
                  {endTimeOptions.map((t) => (
                    <option key={t} value={t}>{formatTime(t)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Attendees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users size={14} className="inline mr-1" />
                Expected Attendees
              </label>
              <input
                type="number"
                name="attendees"
                min={1}
                max={200}
                value={form.attendees}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#227325]/30 focus:border-[#227325]"
              />
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText size={14} className="inline mr-1" />
                Purpose / Description
              </label>
              <textarea
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                required
                rows={3}
                placeholder="e.g. Library orientation for BSCS 1A, Research session, Faculty meeting..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#227325]/30 focus:border-[#227325] resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-[#227325] text-white rounded-lg hover:bg-[#1a5a1d] disabled:opacity-60 transition-colors"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reservations List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">My Reservations</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={24} className="animate-spin mr-2" />
            Loading...
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CalendarDays size={40} className="mb-3 opacity-30" />
            <p className="text-sm">No reservations yet.</p>
            <p className="text-xs mt-1">Click "New Reservation" to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reservations.map((r) => (
              <div key={r.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5">
                      <StatusIcon status={r.status} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">
                          {formatDate(r.reservationDate)}
                        </span>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatTime(r.startTime)} – {formatTime(r.endTime)}
                        <span className="mx-2">·</span>
                        {r.attendees} attendee{r.attendees !== 1 ? "s" : ""}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.purpose}</p>
                      {r.adminNote && (
                        <p className="text-xs text-gray-400 mt-1 italic">
                          Admin note: {r.adminNote}
                        </p>
                      )}
                    </div>
                  </div>

                  {["pending", "approved"].includes(r.status) && (
                    <button
                      onClick={() => handleCancel(r.id)}
                      disabled={cancellingId === r.id}
                      className="shrink-0 flex items-center gap-1 text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {cancellingId === r.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <X size={12} />
                      }
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReservations;
