import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { BookOpen, BookMarked, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
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

const StudentDashboard = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/books")
      .then(({ data }) => setBooks(data.books))
      .finally(() => setLoading(false));
  }, []);

  const available = books.filter((b) => b.status === "available").length;

  return (
    <div className="p-6 space-y-6">
      {/* Profile incomplete alert */}
      {!user?.profileComplete && (
        <div className="flex items-start gap-3 bg-yellow-400 text-yellow-900 rounded-lg px-5 py-4">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">
            <span className="font-bold">Alert!</span> To continue using Cavite State University Integrated Library System Full Services! Click{" "}
            <Link to="/create-profile" className="underline font-bold hover:text-yellow-700">
              create profile
            </Link>{" "}
            details.
          </p>
        </div>
      )}

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.fullName} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Browse the library catalog from the sidebar.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={BookOpen}   label="Total Resources" value={loading ? "..." : books.length}  color="bg-[#227325]" />
        <StatCard icon={BookMarked} label="Available"       value={loading ? "..." : available}     color="bg-blue-500"  />
      </div>
    </div>
  );
};

export default StudentDashboard;
