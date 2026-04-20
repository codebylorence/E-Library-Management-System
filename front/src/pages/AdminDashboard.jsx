import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Users, BookMarked, TrendingUp } from "lucide-react";
import api from "../api/axios";

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

const AdminDashboard = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/books")
      .then(({ data }) => setBooks(data.books))
      .finally(() => setLoading(false));
  }, []);

  const available = books.filter((b) => b.status === "available").length;
  const unavailable = books.filter((b) => b.status === "unavailable").length;

  return (
    <div className="p-6 space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.fullName} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1 capitalize">{user?.role} · E-Library Management System</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen}   label="Total Books"       value={loading ? "..." : books.length}      color="bg-[#227325]" />
        <StatCard icon={BookMarked} label="Available"         value={loading ? "..." : available}         color="bg-blue-500"  />
        <StatCard icon={TrendingUp} label="Unavailable"       value={loading ? "..." : unavailable}       color="bg-orange-500"/>
        <StatCard icon={Users}      label="Registered Users"  value="—"                                   color="bg-purple-500"/>
      </div>

      {/* Recent Books */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Books</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="pb-3 pr-4">Title</th>
                  <th className="pb-3 pr-4">Author</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {books.slice(0, 6).map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-800">{book.title}</td>
                    <td className="py-3 pr-4 text-gray-500">{book.author}</td>
                    <td className="py-3 pr-4 text-gray-500">{book.category}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        book.status === "available"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        {book.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {books.length === 0 && (
              <p className="text-sm text-gray-400 mt-4">No books found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
