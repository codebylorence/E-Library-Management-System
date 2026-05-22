import { useState, useEffect } from "react";
import { QrCode, Clock, CalendarDays, RefreshCw, Download } from "lucide-react";
import api from "../api/axios";

const MyQR = () => {
  const [qr, setQr]           = useState(null);
  const [user, setUser]       = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [qrRes, histRes] = await Promise.all([
        api.get("/attendance/qr"),
        api.get("/attendance/my"),
      ]);
      setQr(qrRes.data.qr);
      setUser(qrRes.data.user);
      setRecords(histRes.data.records);
    } catch {
      setError("Failed to load QR code.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qr;
    link.download = `library-qr-${user?.studentNumber || user?.id}.png`;
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">My Library QR Code</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Show or scan this QR at the library entrance to log your attendance
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
          Loading...
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 self-start">
              <QrCode size={18} className="text-[#227325]" />
              <span className="text-sm font-semibold text-gray-700">Your QR Code</span>
            </div>

            {qr && (
              <img
                src={qr}
                alt="Library QR Code"
                className="w-56 h-56 rounded-xl border-4 border-[#227325]/20 shadow"
              />
            )}

            <div className="text-center">
              <p className="font-bold text-gray-800">{user?.fullName}</p>
              {user?.studentNumber && (
                <p className="text-xs text-gray-500 mt-0.5">{user.studentNumber}</p>
              )}
              {user?.userType && (
                <p className="text-xs text-gray-400">{user.userType}</p>
              )}
            </div>

            <div className="flex gap-2 w-full">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-[#227325] text-[#227325] py-2 text-sm font-semibold hover:bg-[#227325]/5 transition-colors"
              >
                <Download size={15} /> Save QR
              </button>
              <button
                onClick={fetchData}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 text-gray-500 px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={15} />
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Save this QR as a screenshot on your phone or print it. You don't need internet — just show it at the scanner.
            </p>
          </div>

          {/* Attendance History */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-[#227325]" />
              <span className="text-sm font-semibold text-gray-700">My Attendance History</span>
            </div>

            {records.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Clock size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm">No attendance records yet.</p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[420px] space-y-2 pr-1">
                {records.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-gray-700">
                      {new Date(r.date).toLocaleDateString("en-PH", {
                        weekday: "short", year: "numeric", month: "short", day: "numeric",
                      })}
                    </p>
                    <p className="text-xs font-medium text-green-600">
                      {r.timeIn ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyQR;
