import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { BookOpen, BookMarked, Search } from "lucide-react";
import api from "../api/axios";
import CoverImage from "../components/CoverImage";

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value ?? "—"}</p>
    </div>
  </div>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/books")
      .then(({ data }) => setBooks(data.books))
      .finally(() => setLoading(false));
  }, []);

  const available = books.filter((b) => b.status === "available").length;

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {user?.fullName} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">Browse and explore the library collection.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={BookOpen}   label="Total Books"  value={loading ? "..." : books.length}    color="bg-[#227325]" />
        <StatCard icon={BookMarked} label="Available"    value={loading ? "..." : available}       color="bg-blue-500"  />
      </div>

      {/* Search + Book Grid */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-800 flex-1">Browse Books</h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search title, author, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#227325] w-64"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading books...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((book) => (
              <div key={book.id} className="border border-gray-100 rounded-lg p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
                <CoverImage book={book} className="h-36 rounded" />
                <p className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">{book.title}</p>
                <p className="text-xs text-gray-500">{book.author}</p>
                <p className="text-xs text-gray-400">{book.category} · {book.publishedYear}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
                  book.status === "available"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                }`}>
                  {book.status}
                </span>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 col-span-full">No books match your search.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
