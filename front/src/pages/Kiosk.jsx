import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  ScanLine, CheckCircle, AlertCircle, Lock, Eye, EyeOff,
  Library, LogOut, RefreshCw,
} from "lucide-react";
import api from "../api/axios";

/* ─── beep helpers ──────────────────────────────────────── */
const playBeep = (frequency = 900, duration = 0.25, volume = 0.8) => {
  try {
    const sampleRate = 8000;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + numSamples);
    const view   = new DataView(buffer);
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, "RIFF"); view.setUint32(4, 36 + numSamples, true);
    ws(8, "WAVE"); ws(12, "fmt ");
    view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);  view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate, true); view.setUint16(32, 1, true);
    view.setUint16(34, 8, true);  ws(36, "data");
    view.setUint32(40, numSamples, true);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const s = Math.sin(2 * Math.PI * frequency * t) * (1 - t / duration);
      view.setUint8(44 + i, Math.floor((s * 0.5 + 0.5) * 255));
    }
    const url  = URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
    const beep = new Audio(url);
    beep.volume = volume;
    beep.play().catch(() => {});
    beep.onended = () => URL.revokeObjectURL(url);
  } catch { /* silent */ }
};
const successBeep = () => { playBeep(900, 0.15); setTimeout(() => playBeep(1200, 0.15), 180); };
const warningBeep = () => { playBeep(380, 0.45); };
const errorBeep   = () => { playBeep(280, 0.5);  };

/* ─── QR Scanner component ─────────────────────────────── */
const QRScanner = ({ onScan, onError, active }) => {
  const divId  = "kiosk-qr-reader";
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const scanner = new Html5Qrcode(divId);
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 260, height: 260 } },
        (decoded) => onScan(decoded),
        () => {}
      )
      .catch((err) => onError(err?.message || "Camera unavailable"));

    return () => {
      scanner.isScanning && scanner.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        id={divId}
        className="w-full max-w-sm rounded-2xl overflow-hidden border-4 border-white/20 bg-black shadow-2xl"
      />
      <p className="text-white/60 text-sm flex items-center gap-1.5">
        <ScanLine size={15} /> Show your QR code to the camera
      </p>
    </div>
  );
};

/* ─── PIN Entry screen ──────────────────────────────────── */
const PinScreen = ({ onUnlock }) => {
  const [pin,     setPin]     = useState("");
  const [show,    setShow]    = useState(false);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setLoading(true);
    setError("");

    // Verify PIN by doing a test scan with a dummy payload — server will reject
    // the payload but accept the PIN. We just check if it's a PIN error or payload error.
    try {
      await api.post("/attendance/kiosk-scan", { payload: "{}", kioskPin: pin });
      // If somehow it passes (shouldn't with empty uid), unlock anyway
      onUnlock(pin);
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (msg === "Invalid kiosk PIN.") {
        setError("Incorrect PIN. Please try again.");
        errorBeep();
      } else {
        // Any other error means PIN was accepted (payload was just invalid)
        onUnlock(pin);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a4d1c] to-[#0f2e10] flex items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-10 w-full max-w-sm shadow-2xl border border-white/10 space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <Library size={32} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Library Kiosk</h1>
            <p className="text-white/50 text-sm mt-0.5">Cavite State University</p>
          </div>
        </div>

        {/* PIN form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">
              Enter Kiosk PIN
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type={show ? "text" : "password"}
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(""); }}
                placeholder="••••"
                maxLength={8}
                autoFocus
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-10 py-3 text-white placeholder-white/30 text-center text-xl tracking-[0.5em] font-bold focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <p className="text-red-300 text-xs mt-2 flex items-center gap-1">
                <AlertCircle size={12} /> {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full bg-white text-[#227325] font-bold py-3 rounded-xl hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
          >
            {loading ? "Verifying..." : "Unlock Kiosk"}
          </button>
        </form>

        <p className="text-white/30 text-xs text-center">
          This kiosk is for library attendance only.
          <br />Contact the librarian for the PIN.
        </p>
      </div>
    </div>
  );
};

/* ─── Feedback overlay ──────────────────────────────────── */
const FeedbackCard = ({ result, duplicate, error }) => {
  if (!result && !duplicate && !error) return null;

  if (error) return (
    <div className="bg-red-500/20 border border-red-400/40 rounded-2xl px-6 py-5 flex items-start gap-3 max-w-sm w-full">
      <AlertCircle size={22} className="text-red-300 shrink-0 mt-0.5" />
      <div>
        <p className="text-red-200 font-bold text-sm">Scan Error</p>
        <p className="text-red-300/80 text-xs mt-0.5">{error}</p>
      </div>
    </div>
  );

  if (duplicate) return (
    <div className="bg-yellow-500/20 border border-yellow-400/40 rounded-2xl px-6 py-5 max-w-sm w-full space-y-1">
      <div className="flex items-center gap-2">
        <AlertCircle size={20} className="text-yellow-300 shrink-0" />
        <p className="text-yellow-200 font-bold text-sm">Already Recorded Today</p>
      </div>
      <p className="text-white font-semibold text-base">{duplicate.student?.fullName}</p>
      {duplicate.student?.studentNumber && (
        <p className="text-white/50 text-xs">{duplicate.student.studentNumber}</p>
      )}
      <p className="text-yellow-300/70 text-xs">Attendance already logged for today.</p>
    </div>
  );

  return (
    <div className="bg-green-500/20 border border-green-400/40 rounded-2xl px-6 py-5 max-w-sm w-full space-y-1">
      <div className="flex items-center gap-2">
        <CheckCircle size={20} className="text-green-300 shrink-0" />
        <p className="text-green-200 font-bold text-sm">Attendance Recorded</p>
      </div>
      <p className="text-white font-semibold text-base">{result.student?.fullName}</p>
      {result.student?.studentNumber && (
        <p className="text-white/50 text-xs">{result.student.studentNumber}</p>
      )}
      {result.student?.program && (
        <p className="text-white/50 text-xs">{result.student.program}</p>
      )}
      <p className="text-green-300/70 text-xs mt-1">
        Time in: {result.record?.timeIn}
      </p>
    </div>
  );
};

/* ─── Clock ─────────────────────────────────────────────── */
const Clock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-center">
      <p className="text-white/90 text-4xl font-bold tabular-nums tracking-tight">
        {time.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}
      </p>
      <p className="text-white/40 text-sm mt-1">
        {time.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </p>
    </div>
  );
};

/* ─── Main Kiosk Page ───────────────────────────────────── */
const Kiosk = () => {
  const [pin,       setPin]       = useState(null); // null = locked
  const [camError,  setCamError]  = useState("");
  const [result,    setResult]    = useState(null);
  const [duplicate, setDuplicate] = useState(null);
  const [scanError, setScanError] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const cooldown = useRef(false);

  /* fetch today's count */
  const fetchCount = useCallback(async () => {
    try {
      // Use kiosk-scan with a dummy payload just to get a response — instead,
      // we'll just count from the result increments locally
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchCount(); }, [fetchCount]);

  const handleScan = useCallback(async (payload) => {
    if (cooldown.current || loading || !pin) return;
    cooldown.current = true;
    setTimeout(() => { cooldown.current = false; }, 3500);

    setResult(null);
    setDuplicate(null);
    setScanError("");
    setLoading(true);

    try {
      const { data } = await api.post("/attendance/kiosk-scan", { payload, kioskPin: pin });
      setResult(data);
      setTodayCount((c) => c + 1);
      successBeep();
      setTimeout(() => setResult(null), 5000);
    } catch (err) {
      const data = err.response?.data;
      if (data?.alreadyRecorded) {
        warningBeep();
        setDuplicate(data);
        setTimeout(() => setDuplicate(null), 5000);
      } else {
        errorBeep();
        setScanError(data?.message || "Scan failed. Try again.");
        setTimeout(() => setScanError(""), 4000);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, pin]);

  if (!pin) return <PinScreen onUnlock={setPin} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a4d1c] to-[#0f2e10] flex flex-col items-center justify-between p-6 gap-6">

      {/* Top bar */}
      <div className="w-full max-w-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Library size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">CvSU Library</p>
            <p className="text-white/40 text-xs">Attendance Kiosk</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Today's count badge */}
          <div className="bg-white/10 rounded-xl px-3 py-1.5 text-center">
            <p className="text-white font-bold text-lg leading-none">{todayCount}</p>
            <p className="text-white/40 text-[10px]">today</p>
          </div>

          {/* Lock button */}
          <button
            onClick={() => { setPin(null); setCamError(""); }}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs px-3 py-2 rounded-xl transition-colors"
            title="Lock kiosk"
          >
            <LogOut size={14} /> Lock
          </button>
        </div>
      </div>

      {/* Clock */}
      <Clock />

      {/* Scanner */}
      <div className="w-full max-w-sm space-y-4">
        {camError ? (
          <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-6 text-center space-y-3">
            <AlertCircle size={32} className="mx-auto text-red-300" />
            <p className="text-red-200 font-semibold text-sm">Camera Unavailable</p>
            <p className="text-red-300/70 text-xs">{camError}</p>
            <button
              onClick={() => { setCamError(""); }}
              className="flex items-center gap-1.5 mx-auto text-xs text-white/60 hover:text-white transition-colors"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        ) : (
          <QRScanner onScan={handleScan} onError={setCamError} active={!!pin} />
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="text-center text-white/50 text-sm animate-pulse">
            Processing...
          </div>
        )}
      </div>

      {/* Feedback */}
      <div className="w-full max-w-sm flex justify-center min-h-[100px]">
        <FeedbackCard result={result} duplicate={duplicate} error={scanError} />
        {!result && !duplicate && !scanError && !loading && (
          <div className="border border-dashed border-white/10 rounded-2xl px-6 py-5 w-full text-center text-white/25 text-sm">
            Waiting for QR scan...
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-white/20 text-xs text-center pb-2">
        Scan your library QR code to record attendance · One scan per day
      </p>
    </div>
  );
};

export default Kiosk;
