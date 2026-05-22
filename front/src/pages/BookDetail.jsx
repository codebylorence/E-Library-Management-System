import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Download, ExternalLink, BookOpen, FileText,
  BookMarked, GraduationCap, Newspaper, Calendar, User,
  Tag, Hash, MapPin, Layers, Building, BookCopy, BookPlus, X, Clock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import CoverImage from "../components/CoverImage";

const TYPE_META = {
  "Library Books":         { color: "bg-green-100 text-green-700",   icon: BookOpen,      label: "Library Book"   },
  "E-Books":               { color: "bg-blue-100 text-blue-700",     icon: FileText,      label: "E-Book"         },
  "E-Journals":            { color: "bg-purple-100 text-purple-700", icon: BookMarked,    label: "E-Journal"      },
  "Thesis / Dissertation": { color: "bg-yellow-100 text-yellow-700", icon: GraduationCap, label: "Thesis"         },
  "Magazine / Article":    { color: "bg-pink-100 text-pink-700",     icon: Newspaper,     label: "Magazine"       },
};

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="p-1.5 bg-gray-100 rounded-md shrink-0 mt-0.5">
        <Icon size={14} className="text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
};

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [borrowing, setBorrowing]     = useState(false);
  const [borrowMsg, setBorrowMsg]     = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loanDays, setLoanDays]       = useState(7);

  const fetchBook = () => {
    api.get(`/books/${id}`)
      .then(({ data }) => setBook(data.book))
      .catch(() => setError("Failed to load resource details."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBook(); }, [id]);

  const handleBorrow = async () => {
    setBorrowing(true);
    setBorrowMsg(null);
    setShowConfirm(false);
    try {
      await api.post("/borrows", { bookId: id, loanDays });
      setBorrowMsg({ type: "success", text: "Borrow request submitted! A librarian will approve it when you pick up the book." });
      fetchBook();
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresAttendance) {
        setBorrowMsg({
          type: "attendance",
          text: "You need to log your attendance at the library today before you can borrow a book. Please ask the librarian to scan your QR code.",
        });
      } else {
        setBorrowMsg({ type: "error", text: data?.message || "Failed to submit borrow request." });
      }
    } finally {
      setBorrowing(false);
    }
  };

  if (loading) return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-32" />
      <div className="flex gap-6">
        <div className="w-48 h-64 bg-gray-200 rounded-xl shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  if (error || !book) return (
    <div className="p-6 text-center py-20 text-gray-400">
      <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
      <p className="text-sm">{error || "Resource not found."}</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-sm text-[#227325] hover:underline">← Go back</button>
    </div>
  );

  const meta        = TYPE_META[book.materialType] || TYPE_META["Library Books"];
  const Icon        = meta.icon;
  const isPhysical  = book.materialType === "Library Books";
  const isAvailable = book.status === "available" && book.availableCopies > 0;
  const canBorrow   = user && isPhysical && isAvailable;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#227325] transition-colors font-medium"
      >
        <ArrowLeft size={16} /> Back to Catalog
      </button>

      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Hero strip */}
        <div className="bg-[#227325] px-8 py-6 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
            <Icon size={13} /> {meta.label}
          </span>
          {isPhysical && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              book.status === "available" ? "bg-green-200 text-green-900" : "bg-red-200 text-red-900"
            }`}>
              {book.status}
            </span>
          )}
        </div>

        <div className="p-8">
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Cover + actions */}
            <div className="shrink-0 w-full sm:w-44 space-y-3">
              <CoverImage book={book} className="h-60 sm:h-56 rounded-xl shadow-md" />

              {isPhysical && user && user.role === "student" && (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!canBorrow || borrowing}
                  className={`flex items-center justify-center gap-2 w-full text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm ${
                    canBorrow
                      ? "bg-[#227325] hover:bg-[#1a5c1d] text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <BookPlus size={15} />
                  {borrowing ? "Submitting..." : canBorrow ? "Borrow Book" : "Unavailable"}
                </button>
              )}

              {book.fileUrl && (
                <a href={book.fileUrl} download target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#227325] hover:bg-[#1a5c1d] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm">
                  <Download size={15} /> Download PDF
                </a>
              )}
              {book.accessUrl && (
                <a href={book.accessUrl} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-[#227325] text-[#227325] hover:bg-green-50 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
                  <ExternalLink size={15} /> Access Online
                </a>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{book.title}</h1>
              <p className="text-base text-gray-500 mt-1">
                by <span className="font-medium text-gray-700">{book.author}</span>
              </p>

              {borrowMsg && (
                <div className={`mt-3 px-4 py-3 rounded-lg text-sm font-medium ${
                  borrowMsg.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : borrowMsg.type === "attendance"
                    ? "bg-yellow-50 text-yellow-800 border border-yellow-300"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}>
                  {borrowMsg.type === "attendance" && <span className="font-bold block mb-0.5">⚠ Attendance Required</span>}
                  {borrowMsg.text}
                </div>
              )}

              {book.description && (
                <p className="mt-4 text-sm text-gray-600 leading-relaxed border-l-4 border-green-200 pl-4 italic">
                  {book.description}
                </p>
              )}

              {book.abstract && (
                <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                  <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-2">Abstract</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{book.abstract}</p>
                </div>
              )}
            </div>
          </div>

          {/* Details grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-12">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Details</p>
              <InfoRow icon={Calendar}   label="Year Published"  value={book.publishedYear} />
              <InfoRow icon={Tag}        label="Category"        value={book.category} />
              <InfoRow icon={Building}   label="Publisher"       value={book.publisher} />
              <InfoRow icon={Hash}       label="ISBN"            value={book.isbn} />
              <InfoRow icon={MapPin}     label="Shelf Location"  value={book.shelfLocation} />
              <InfoRow icon={BookCopy}   label="Copies Available"
                value={book.quantity != null ? `${book.availableCopies} of ${book.quantity}` : null} />
              <InfoRow icon={BookMarked} label="Journal Name"    value={book.journalName} />
              <InfoRow icon={Layers}     label="Volume / Issue"  value={
                book.volume || book.issue ? [book.volume, book.issue].filter(Boolean).join(" · ") : null
              } />
              <InfoRow icon={Hash}       label="ISSN"            value={book.issn} />
              <InfoRow icon={Newspaper}  label="Publication"     value={book.magazineName} />
              <InfoRow icon={Hash}       label="DOI"             value={book.articleDoi} />
              <InfoRow icon={Layers}     label="Pages"           value={book.pageRange} />
            </div>

            {book.materialType === "Thesis / Dissertation" && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Academic Info</p>
                <InfoRow icon={GraduationCap} label="Degree"     value={book.degree} />
                <InfoRow icon={BookOpen}      label="Program"    value={book.program} />
                <InfoRow icon={Building}      label="Department" value={book.department} />
                <InfoRow icon={User}          label="Adviser"    value={book.advisor} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Borrow Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookPlus size={20} className="text-[#227325]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">Confirm Borrow Request</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Your request will be reviewed by a librarian</p>
                </div>
              </div>
              <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-3 bg-gray-50 rounded-xl p-4">
              <CoverImage book={book} className="h-20 w-14 rounded-lg shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">{book.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {book.availableCopies} cop{book.availableCopies !== 1 ? "ies" : "y"} available
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Clock size={14} className="inline mr-1.5 text-gray-400" />
                Loan Period
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[7, 8, 10, 14].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setLoanDays(d)}
                    className={`py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
                      loanDays === d
                        ? "border-[#227325] bg-green-50 text-[#227325]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Due date will be set when the librarian approves your request.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-xs text-yellow-800">
              <strong>How it works:</strong> Submit your request here, then go to the library to pick up the book. The librarian will approve your request when you arrive.
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBorrow}
                disabled={borrowing}
                className="flex-1 rounded-lg bg-[#227325] hover:bg-[#1a5c1d] text-white py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {borrowing ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetail;
