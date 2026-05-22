import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, CheckCircle, AlertTriangle, ArrowLeft, X, Trash2 } from "lucide-react";
import api from "../api/axios";
import CoverImage from "../components/CoverImage";

const statusMeta = {
  pending:  { label: "Pending Approval", color: "bg-yellow-100 text-yellow-700", icon: Clock         },
  borrowed: { label: "Borrowed",         color: "bg-blue-100 text-blue-700",     icon: Clock         },
  overdue:  { label: "Overdue",          color: "bg-red-100 text-red-600",       icon: AlertTriangle },
  returned: { label: "Returned",         color: "bg-green-100 text-green-700",   icon: CheckCircle   },
  rejected: { label: "Rejected",         color: "bg-gray-100 text-gray-500",     icon: X             },
};

const fineMeta = {
  unpaid: { label: "Fine Unpaid", color: "bg-red-100 text-red-600"     },
  paid:   { label: "Fine Paid",   color: "bg-green-100 text-green-700" },
};

const MyBorrows = () => {
  const navigate = useNavigate();
  const [borrows, setBorrows]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [cancelModal, setCancelModal] = useState(null); // borrow record to cancel
  const [cancelling, setCancelling]   = useState(false);

  const fetchBorrows = () => {
    setLoading(true);
    api.get("/borrows/my")
      .then(({ data }) => setBorrows(data.borrows))
      .catch(() => setError("Failed to load borrow history."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBorrows(); }, []);

  const handleCancel = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      await api.patch(`/borrows/${cancelModal.id}/cancel`);
      setCancelModal(null);
      fetchBorrows();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel request.");
    } finally {
      setCancelling(false);
    }
  };

  const active   = borrows.filter((b) => b.status === "borrowed");
  const pending  = borrows.filter((b) => b.status === "pending");
  const overdue  = borrows.filter((b) => b.status === "overdue");
  const returned = borrows.filter((b) => b.status === "returned");

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">My Borrowed Books</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your borrowing history and fines</p>
        </div>
      </div>

      {/* Summary pills */}
      {!loading && (
        <div className="flex flex-wrap gap-3">
          {pending.length > 0 && (
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
              {pending.length} Pending Approval
            </span>
          )}
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            {active.length} Active
          </span>
          {overdue.length > 0 && (
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-600 flex items-center gap-1">
              <AlertTriangle size={12} /> {overdue.length} Overdue
            </span>
          )}
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
            {returned.length} Returned
          </span>
        </div>
      )}

      {/* Unpaid fine warning */}
      {overdue.some((b) => b.fineStatus === "unpaid") && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-5 py-4">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">You have unpaid fines!</p>
            <p className="text-xs text-red-600 mt-0.5">
              Please settle your fines at the library to continue borrowing books.
            </p>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-gray-400">Loading...</p>}
      {error   && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && borrows.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">You haven't borrowed any books yet.</p>
        </div>
      )}

      {!loading && !error && borrows.length > 0 && (
        <div className="space-y-3">
          {borrows.map((b) => {
            const sm = statusMeta[b.status] || statusMeta.borrowed;
            const StatusIcon = sm.icon;
            const isOverdue = b.status === "overdue";
            return (
              <div
                key={b.id}
                className={`bg-white rounded-xl border shadow-sm p-4 flex gap-4 ${
                  isOverdue ? "border-red-200" : "border-gray-100"
                }`}
              >
                {/* Cover */}
                <div className="w-16 shrink-0">
                  <CoverImage book={b.book} className="h-20 rounded-lg" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{b.book?.title}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${sm.color}`}>
                      <StatusIcon size={11} /> {sm.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{b.book?.author}</p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>Borrowed: <span className="font-medium text-gray-700">{b.borrowDate}</span></span>
                    <span>Due: <span className={`font-medium ${isOverdue ? "text-red-600" : "text-gray-700"}`}>{b.dueDate}</span></span>
                    {b.returnDate && <span>Returned: <span className="font-medium text-gray-700">{b.returnDate}</span></span>}
                    {b.status === "pending" && b.expiresInMinutes !== undefined && (
                      <span className={`font-medium ${b.expiresInMinutes < 60 ? "text-red-500" : "text-yellow-600"}`}>
                        ⏱ Expires in: {b.expiresInMinutes >= 60
                          ? `${Math.floor(b.expiresInMinutes / 60)}h ${b.expiresInMinutes % 60}m`
                          : `${b.expiresInMinutes}m`}
                      </span>
                    )}
                  </div>

                  {/* Fine info */}
                  {b.fineStatus !== "none" && b.fineStatus && (
                    <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold ${fineMeta[b.fineStatus]?.color}`}>
                      {b.fineStatus === "unpaid" ? (
                        <>⚠ Fine: ₱{Number(b.fineAmount).toFixed(2)} ({b.overdueDays} day{b.overdueDays !== 1 ? "s" : ""} overdue) — Unpaid</>
                      ) : (
                        <>✓ Fine: ₱{Number(b.fineAmount).toFixed(2)} — Paid</>
                      )}
                    </div>
                  )}
                  {/* Rejection note */}
                  {b.status === "rejected" && b.rejectionNote && (
                    <p className="mt-2 text-xs text-gray-500 italic">Reason: {b.rejectionNote}</p>
                  )}

                  {/* Cancel button — only for pending */}
                  {b.status === "pending" && (
                    <div className="mt-3">
                      <button
                        onClick={() => setCancelModal(b)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={13} /> Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Cancel Borrow Request?</h3>
                <p className="text-xs text-gray-400 mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <div className="flex gap-3 bg-gray-50 rounded-xl p-3">
              <CoverImage book={cancelModal.book} className="h-16 w-12 rounded-lg shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
                  {cancelModal.book?.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{cancelModal.book?.author}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to cancel your borrow request for this book?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setCancelModal(null)}
                disabled={cancelling}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Keep Request
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 rounded-lg bg-red-500 hover:bg-red-600 text-white py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBorrows;
