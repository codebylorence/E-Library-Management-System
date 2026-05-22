import { useState, useEffect, useMemo } from "react";
import { Search, X, BookOpen, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CoverImage from "../components/CoverImage";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const Catalogs = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMaterial, setFilterMaterial] = useState("all");

  useEffect(() => {
    axios.get("/api/books")
      .then(({ data }) => setBooks(data.books))
      .catch(() => setError("Failed to load books. Please try again later."))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(books.map((b) => b.category).filter(Boolean)))],
    [books]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return books.filter((b) => {
      const matchSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || b.status === filterStatus;
      const matchCategory = filterCategory === "all" || b.category === filterCategory;
      const matchMaterial = filterMaterial === "all" || b.materialType === filterMaterial;
      return matchSearch && matchStatus && matchCategory && matchMaterial;
    });
  }, [books, search, filterStatus, filterCategory, filterMaterial]);

  const hasActiveFilters =
    search || filterStatus !== "all" || filterCategory !== "all" || filterMaterial !== "all";

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setFilterCategory("all");
    setFilterMaterial("all");
  };

  const selectClass =
    "rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#227325] bg-white";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-[#227325] pt-28 pb-10 px-6 text-white text-center">
        <h1 className="text-3xl font-bold mb-2">Library Catalogs</h1>
        <p className="text-green-100 text-sm">Browse our collection of books, e-books, and journals</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Login gate alert */}
        {!user && (
          <div className="flex items-start gap-3 bg-yellow-400 text-yellow-900 rounded-lg px-5 py-4 shadow-sm">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold">Login with your CvSU account first!</p>
              <p className="text-xs mt-1">You need to sign in with your CvSU email to browse the library catalog.</p>
            </div>
          </div>
        )}

        {/* Show content only if logged in */}
        {user ? (
          <>

        {/* Filters bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search title, author, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#227325]"
            />
          </div>

          {/* Material type */}
          <select value={filterMaterial} onChange={(e) => setFilterMaterial(e.target.value)} className={selectClass}>
            <option value="all">All Types</option>
            <option value="Library Books">Library Books</option>
            <option value="E-Books">E-Books</option>
            <option value="E-Journals">E-Journals</option>
          </select>

          {/* Category */}
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={selectClass}>
            {categories.map((c) => (
              <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
            ))}
          </select>

          {/* Status */}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClass}>
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}

          {!loading && (
            <span className="ml-auto text-xs text-gray-400">
              {filtered.length} of {books.length} books
            </span>
          )}
        </div>

        {/* States */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Book cards grid */}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {hasActiveFilters ? "No books match your filters." : "No books available."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filtered.map((book) => (
                  <div
                    key={book.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group"
                  >
                    {/* Cover */}
                    <CoverImage book={book} className="h-48" />

                    {/* Info */}
                    <div className="p-4 flex flex-col gap-1 flex-1">
                      <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-xs text-gray-500">{book.author}</p>
                      <p className="text-xs text-gray-400">{book.category} · {book.publishedYear}</p>

                      {book.shelfLocation && (
                        <p className="text-xs text-gray-400">Shelf: {book.shelfLocation}</p>
                      )}

                      <div className="mt-auto pt-3 flex items-center justify-between">
                        {/* Material type badge */}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                          {book.materialType || "Library Books"}
                        </span>

                        {/* Status badge */}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          book.status === "available"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}>
                          {book.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        </> ) : null}
      </div>
    </div>
  );
};

export default Catalogs;
