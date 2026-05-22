import { useState, useEffect, useMemo } from "react";
import { Search, X, BookOpen, FileText, BookMarked, GraduationCap, Newspaper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import CoverImage from "../components/CoverImage";

const TYPE_META = {
  "Library Books":        { color: "bg-green-100 text-green-700",  icon: BookOpen      },
  "E-Books":              { color: "bg-blue-100 text-blue-700",    icon: FileText      },
  "E-Journals":           { color: "bg-purple-100 text-purple-700",icon: BookMarked    },
  "Thesis / Dissertation":{ color: "bg-yellow-100 text-yellow-700",icon: GraduationCap },
  "Magazine / Article":   { color: "bg-pink-100 text-pink-700",    icon: Newspaper     },
};

const StudentCatalogs = () => {
  const navigate = useNavigate();
  const [books, setBooks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const [search, setSearch]               = useState("");
  const [filterStatus, setFilterStatus]   = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMaterial, setFilterMaterial] = useState("all");

  useEffect(() => {
    api.get("/books")
      .then(({ data }) => setBooks(data.books))
      .catch(() => setError("Failed to load catalog. Please try again."))
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
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q);
      const matchStatus   = filterStatus   === "all" || b.status       === filterStatus;
      const matchCategory = filterCategory === "all" || b.category     === filterCategory;
      const matchMaterial = filterMaterial === "all" || b.materialType === filterMaterial;
      return matchSearch && matchStatus && matchCategory && matchMaterial;
    });
  }, [books, search, filterStatus, filterCategory, filterMaterial]);

  const hasFilters = search || filterStatus !== "all" || filterCategory !== "all" || filterMaterial !== "all";

  const clearFilters = () => {
    setSearch(""); setFilterStatus("all"); setFilterCategory("all"); setFilterMaterial("all");
  };

  const sel = "rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#227325] bg-white";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Library Catalog</h1>
        <p className="text-sm text-gray-500 mt-0.5">Browse books, e-books, journals, theses, and more</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
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

        <select value={filterMaterial} onChange={(e) => setFilterMaterial(e.target.value)} className={sel}>
          <option value="all">All Types</option>
          <option value="Library Books">Library Books</option>
          <option value="E-Books">E-Books</option>
          <option value="E-Journals">E-Journals</option>
          <option value="Thesis / Dissertation">Thesis / Dissertation</option>
          <option value="Magazine / Article">Magazine / Article</option>
        </select>

        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={sel}>
          {categories.map((c) => (
            <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
          ))}
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={sel}>
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors">
            <X size={13} /> Clear
          </button>
        )}

        {!loading && (
          <span className="ml-auto text-xs text-gray-400">
            {filtered.length} of {books.length} resources
          </span>
        )}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500 text-center py-8">{error}</p>}

      {/* Book grid */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{hasFilters ? "No resources match your filters." : "No resources available yet."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filtered.map((book) => {
                const meta = TYPE_META[book.materialType] || TYPE_META["Library Books"];
                const Icon = meta.icon;
                return (
                  <div
                    key={book.id}
                    onClick={() => navigate(`/student/books/${book.id}`)}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col overflow-hidden cursor-pointer"
                  >
                    <CoverImage book={book} className="h-48" />
                    <div className="p-4 flex flex-col gap-1 flex-1">
                      <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">{book.title}</h3>
                      <p className="text-xs text-gray-500">{book.author}</p>
                      <p className="text-xs text-gray-400">{book.category} · {book.publishedYear}</p>
                      {book.shelfLocation && (
                        <p className="text-xs text-gray-400">Shelf: {book.shelfLocation}</p>
                      )}
                      <div className="mt-auto pt-3 flex items-center justify-between gap-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
                          <Icon size={10} /> {book.materialType || "Library Books"}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          book.status === "available" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                        }`}>
                          {book.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentCatalogs;
