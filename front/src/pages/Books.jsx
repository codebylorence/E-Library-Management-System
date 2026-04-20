import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { Search, X, Plus, Link, Upload } from "lucide-react";
import api from "../api/axios";

const EMPTY_FORM = { title: "", author: "", isbn: "", category: "", publishedYear: "", quantity: "", shelfLocation: "", coverImage: "", description: "", materialType: "Library Books" };

const Books = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [coverMode, setCoverMode] = useState("url"); // "url" | "file"
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");

  // Search & filter state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/books");
      setBooks(data.books);
    } catch {
      setError("Failed to load books.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      let coverImageUrl = form.coverImage;

      // If file mode, upload the file first
      if (coverMode === "file" && coverFile) {
        const fd = new FormData();
        fd.append("cover", coverFile);
        const { data } = await api.post("/upload/cover", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        coverImageUrl = data.url; // relative path e.g. /uploads/covers/filename.jpg
      }

      await api.post("/books", {
        ...form,
        coverImage: coverImageUrl,
        publishedYear: Number(form.publishedYear),
        quantity: Number(form.quantity),
      });
      setForm(EMPTY_FORM);
      setCoverFile(null);
      setCoverPreview("");
      setCoverMode("url");
      setShowModal(false);
      fetchBooks();
    } catch (err) {
      setFormError(err.response?.data?.error || err.response?.data?.message || "Failed to add book.");
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setCoverFile(null);
    setCoverPreview("");
    setCoverMode("url");
    setFormError("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this book?")) return;
    try {
      await api.delete(`/books/${id}`);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch {
      alert("Failed to delete book.");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setFilterCategory("all");
  };

  // Unique categories derived from books
  const categories = useMemo(
    () => ["all", ...Array.from(new Set(books.map((b) => b.category).filter(Boolean)))],
    [books]
  );

  // Filtered books
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return books.filter((b) => {
      const matchSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || b.status === filterStatus;
      const matchCategory = filterCategory === "all" || b.category === filterCategory;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [books, search, filterStatus, filterCategory]);

  const hasActiveFilters = search || filterStatus !== "all" || filterCategory !== "all";

  const inputClass = "w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-[#227325] focus:ring-1 focus:ring-[#227325] outline-none";
  const selectClass = "rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#227325] bg-white";

  return (
    <div className="p-6 space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Books Management</h1>
        {(user?.role === "admin" || user?.role === "librarian") && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-md bg-[#227325] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Add New Book
          </button>
        )}
      </div>

      {/* Books Table */}
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <h2 className="text-lg font-semibold text-gray-800 flex-1">All Books</h2>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search title, author, ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#227325] w-56"
            />
          </div>

          {/* Status filter */}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClass}>
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>

          {/* Category filter */}
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={selectClass}>
            {categories.map((c) => (
              <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors">
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {!loading && !error && (
          <p className="text-xs text-gray-400 mb-3">Showing {filtered.length} of {books.length} books</p>
        )}

        {loading && <p className="text-gray-500 text-sm">Loading...</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Copies</th>
                  <th className="px-4 py-3">Shelf</th>
                  <th className="px-4 py-3">Status</th>
                  {user?.role === "admin" && <th className="px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{book.title}</td>
                    <td className="px-4 py-3 text-gray-600">{book.author}</td>
                    <td className="px-4 py-3 text-gray-600">{book.category}</td>
                    <td className="px-4 py-3 text-gray-600">{book.publishedYear}</td>
                    <td className="px-4 py-3 text-gray-600">{book.availableCopies}/{book.quantity}</td>
                    <td className="px-4 py-3 text-gray-600">{book.shelfLocation || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${book.status === "available" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {book.status}
                      </span>
                    </td>
                    {user?.role === "admin" && (
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(book.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-gray-500 text-sm mt-4">
                {hasActiveFilters ? "No books match your search or filters." : "No books found."}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Add Book Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Add New Book</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleAddBook} className="px-6 py-5 space-y-4">
              {formError && (
                <p className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">{formError}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Title <span className="text-red-400">*</span></label>
                  <input name="title" value={form.title} onChange={handleFormChange} placeholder="e.g. The Great Gatsby" required className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Author <span className="text-red-400">*</span></label>
                  <input name="author" value={form.author} onChange={handleFormChange} placeholder="e.g. F. Scott Fitzgerald" required className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">ISBN <span className="text-red-400">*</span></label>
                  <input name="isbn" value={form.isbn} onChange={handleFormChange} placeholder="e.g. 978-3-16-148410-0" required className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Category <span className="text-red-400">*</span></label>
                  <input name="category" value={form.category} onChange={handleFormChange} placeholder="e.g. Fiction" required className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Published Year <span className="text-red-400">*</span></label>
                  <input name="publishedYear" value={form.publishedYear} onChange={handleFormChange} placeholder="e.g. 1925" type="number" required className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Quantity <span className="text-red-400">*</span></label>
                  <input name="quantity" value={form.quantity} onChange={handleFormChange} placeholder="e.g. 5" type="number" required className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Shelf Location</label>
                  <input name="shelfLocation" value={form.shelfLocation} onChange={handleFormChange} placeholder="e.g. A-12" className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Cover Image</label>
                  {/* Toggle */}
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium mb-1">
                    <button
                      type="button"
                      onClick={() => { setCoverMode("url"); setCoverFile(null); setCoverPreview(""); }}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 transition-colors ${coverMode === "url" ? "bg-[#227325] text-white" : "text-gray-500 hover:bg-gray-50"}`}
                    >
                      <Link size={12} /> URL
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCoverMode("file"); setForm(p => ({ ...p, coverImage: "" })); }}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 transition-colors ${coverMode === "file" ? "bg-[#227325] text-white" : "text-gray-500 hover:bg-gray-50"}`}
                    >
                      <Upload size={12} /> Upload
                    </button>
                  </div>

                  {coverMode === "url" ? (
                    <input
                      name="coverImage"
                      value={form.coverImage}
                      onChange={handleFormChange}
                      placeholder="https://..."
                      className={inputClass}
                    />
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleFileChange}
                        className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-[#227325] file:text-white hover:file:opacity-90 cursor-pointer"
                      />
                      {coverPreview && (
                        <img src={coverPreview} alt="Preview" className="h-24 rounded-md object-cover border border-gray-200" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Material Type <span className="text-red-400">*</span></label>
                  <select name="materialType" value={form.materialType} onChange={handleFormChange} className={inputClass}>
                    <option value="Library Books">Library Books</option>
                    <option value="E-Books">E-Books</option>
                    <option value="E-Journals">E-Journals</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Brief description of the book..." rows={3} className={`${inputClass} resize-none`} />
              </div>

              {/* Modal footer */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="rounded-md bg-[#227325] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60">
                  {formLoading ? "Saving..." : "Save Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Books;
