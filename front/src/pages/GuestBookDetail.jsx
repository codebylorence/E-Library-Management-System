import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Download, ExternalLink, BookOpen, FileText,
  BookMarked, GraduationCap, Newspaper, Calendar, User,
  Tag, Hash, MapPin, Layers, Building, BookCopy, LogIn,
} from "lucide-react";
import api from "../api/axios";
import CoverImage from "../components/CoverImage";
import cvsulogo from "../assets/CvSU-Logo.webp";

const TYPE_META = {
  "Library Books":         { color: "bg-green-100 text-green-700",   icon: BookOpen,      label: "Library Book" },
  "E-Books":               { color: "bg-blue-100 text-blue-700",     icon: FileText,      label: "E-Book"       },
  "E-Journals":            { color: "bg-purple-100 text-purple-700", icon: BookMarked,    label: "E-Journal"    },
  "Thesis / Dissertation": { color: "bg-yellow-100 text-yellow-700", icon: GraduationCap, label: "Thesis"       },
  "Magazine / Article":    { color: "bg-pink-100 text-pink-700",     icon: Newspaper,     label: "Magazine"     },
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

const GuestBookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    api.get(`/books/${id}`)
      .then(({ data }) => setBook(data.book))
      .catch(() => setError("Failed to load resource details."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
      Loading...
    </div>
  );

  if (error || !book) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-400 gap-3">
      <BookOpen size={40} className="opacity-30" />
      <p className="text-sm">{error || "Resource not found."}</p>
      <button onClick={() => navigate("/guest/catalogs")} className="text-sm text-[#227325] hover:underline">
        ← Back to Catalog
      </button>
    </div>
  );

  const meta       = TYPE_META[book.materialType] || TYPE_META["Library Books"];
  const Icon       = meta.icon;
  const isPhysical = book.materialType === "Library Books";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Guest top bar */}
      <header className="bg-[#227325] px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src={cvsulogo} alt="CvSU" className="w-9 h-9 object-contain" />
          <div className="leading-tight">
            <p className="text-white text-sm font-bold">Cavite State University - Carmona</p>
            <p className="text-white/80 text-xs">E-Library Management System</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 bg-white text-[#227325] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-50 transition-colors shadow-sm"
        >
          <LogIn size={15} /> Sign In
        </button>
      </header>

      {/* Guest banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2.5">
        <p className="text-xs text-yellow-800">
          <span className="font-semibold">Browsing as Guest</span> — Sign in to borrow books and access full features.
        </p>
      </div>

      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        <button
          onClick={() => navigate("/guest/catalogs")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#227325] transition-colors font-medium"
        >
          <ArrowLeft size={16} /> Back to Catalog
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
              <div className="shrink-0 w-full sm:w-44 space-y-3">
                <CoverImage book={book} className="h-60 sm:h-56 rounded-xl shadow-md" />

                {/* Borrow prompt for guests */}
                {isPhysical && (
                  <button
                    onClick={() => navigate("/login")}
                    className="flex items-center justify-center gap-2 w-full bg-[#227325] hover:bg-[#1a5c1d] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                  >
                    <LogIn size={15} /> Sign In to Borrow
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

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{book.title}</h1>
                <p className="text-base text-gray-500 mt-1">
                  by <span className="font-medium text-gray-700">{book.author}</span>
                </p>
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

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-12">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Details</p>
                <InfoRow icon={Calendar}   label="Year Published"   value={book.publishedYear} />
                <InfoRow icon={Tag}        label="Category"         value={book.category} />
                <InfoRow icon={Building}   label="Publisher"        value={book.publisher} />
                <InfoRow icon={Hash}       label="ISBN"             value={book.isbn} />
                <InfoRow icon={MapPin}     label="Shelf Location"   value={book.shelfLocation} />
                <InfoRow icon={BookCopy}   label="Copies Available"
                  value={book.quantity != null ? `${book.availableCopies} of ${book.quantity}` : null} />
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
      </div>
    </div>
  );
};

export default GuestBookDetail;
