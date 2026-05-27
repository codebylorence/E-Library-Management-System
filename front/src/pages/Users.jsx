import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Search, X, Trash2, ShieldCheck, GraduationCap, BookUser, UserCog } from "lucide-react";
import api from "../api/axios";
import IconBtn from "../components/IconBtn";

/* ── helpers ── */
const roleBadge = (role) => ({
  admin:     "bg-purple-100 text-purple-700",
  librarian: "bg-blue-100 text-blue-700",
  student:   "bg-green-100 text-green-700",
  faculty:   "bg-orange-100 text-orange-700",
  staff:     "bg-teal-100 text-teal-700",
}[role] ?? "bg-gray-100 text-gray-600");

const roleIcon = (role) => {
  if (role === "admin")     return <ShieldCheck size={13} />;
  if (role === "librarian") return <BookUser size={13} />;
  if (role === "faculty")   return <GraduationCap size={13} />;
  if (role === "staff")     return <UserCog size={13} />;
  return <GraduationCap size={13} />;
};

/* ══════════════════════════════════════════════ */
const Users = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [roleTarget, setRoleTarget]       = useState(null);   // user being role-edited
  const [selectedRole, setSelectedRole]   = useState("");
  const [roleLoading, setRoleLoading]     = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setUsers(data.users);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast("User deleted successfully.");
    } catch {
      toast("Failed to delete user.", "error");
    }
  };

  const openRoleModal = (u) => {
    setRoleTarget(u);
    setSelectedRole(u.role);
  };

  const handleRoleChange = async () => {
    if (!roleTarget || selectedRole === roleTarget.role) {
      setRoleTarget(null);
      return;
    }
    setRoleLoading(true);
    try {
      await api.patch(`/users/${roleTarget.id}/role`, { role: selectedRole });
      setUsers((prev) =>
        prev.map((u) => u.id === roleTarget.id ? { ...u, role: selectedRole } : u)
      );
      setRoleTarget(null);
      toast(`Role updated to ${selectedRole}.`);
    } catch (err) {
      toast(err.response?.data?.message || "Failed to update role.", "error");
    } finally {
      setRoleLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        !q ||
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.studentNumber?.toLowerCase().includes(q);
      const matchRole = filterRole === "all" || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [users, search, filterRole]);

  const hasFilters = search || filterRole !== "all";
  const selectClass = "rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#227325] bg-white";

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Users Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">All registered accounts</p>
      </div>

      <section className="bg-white rounded-xl shadow-sm p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <h2 className="text-base font-semibold text-gray-800 flex-1">All Users</h2>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, student no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#227325] w-64"
            />
          </div>

          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={selectClass}>
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="librarian">Librarian</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="staff">Staff</option>
          </select>

          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setFilterRole("all"); }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {!loading && !error && (
          <p className="text-xs text-gray-400 mb-3">Showing {filtered.length} of {users.length} users</p>
        )}

        {loading && <p className="text-sm text-gray-400">Loading...</p>}
        {error   && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Student No.</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Registered</th>
                  {currentUser?.role === "admin" && <th className="px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{u.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.studentNumber ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.program ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge(u.role)}`}>
                        {roleIcon(u.role)} {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    {currentUser?.role === "admin" && (
                      <td className="px-4 py-3">
                        {u.id !== currentUser.id ? (
                          <div className="flex items-center gap-1">
                            <IconBtn
                              onClick={() => openRoleModal(u)}
                              title="Change role"
                              icon={UserCog}
                              color="blue"
                            />
                            <IconBtn
                              onClick={() => setDeleteTarget(u)}
                              title="Delete user"
                              icon={Trash2}
                              color="red"
                            />
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 mt-4">
                {hasFilters ? "No users match your search or filters." : "No users found."}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Role Change Modal ── */}
      {roleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserCog size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Change Role</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Assign a new role to <span className="font-medium text-gray-700">{roleTarget.fullName}</span>
                </p>
              </div>
            </div>

            {/* Current role */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Current role:</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge(roleTarget.role)}`}>
                {roleIcon(roleTarget.role)} {roleTarget.role}
              </span>
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">New Role</label>
              <div className="grid grid-cols-3 gap-2">
                {["student", "faculty", "staff", "librarian", "admin"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-colors capitalize ${
                      selectedRole === r
                        ? r === "admin"     ? "border-purple-500 bg-purple-50 text-purple-700"
                        : r === "librarian" ? "border-blue-500 bg-blue-50 text-blue-700"
                        : r === "faculty"   ? "border-orange-500 bg-orange-50 text-orange-700"
                        : r === "staff"     ? "border-teal-500 bg-teal-50 text-teal-700"
                        :                    "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning for admin role */}
            {selectedRole === "admin" && (
              <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                ⚠ Assigning admin role grants full system access including user management.
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setRoleTarget(null)}
                className="flex-1 rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={roleLoading || selectedRole === roleTarget.role}
                className="flex-1 rounded-md bg-[#227325] hover:bg-[#1a5c1d] text-white py-2 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {roleLoading ? "Saving..." : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Delete User</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-gray-700">{deleteTarget.fullName}</span>?
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
