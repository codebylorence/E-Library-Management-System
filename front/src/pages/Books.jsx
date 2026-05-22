import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Search, X, Plus, Trash2, Upload, BookOpen,
  FileText, BookMarked, GraduationCap, Newspaper, Pencil,
} from "lucide-react";
import api from "../api/axios";
import IconBtn from "../components/IconBtn";

/* ── constants ─────────────────────────────────── */
const TYPES = {
  PHYSICAL: "Library Books",
  EBOOK:    "E-Books",
  EJOURNAL: "E-Journals",
  THESIS:   "Thesis / Dissertation",
  MAGAZINE: "Magazine / Article",
};

const TYPE_META = {
  [TYPES.PHYSICAL]: { icon: BookOpen,      color: "bg-green-100 text-green-700",  label: "Library Book"  },
  [TYPES.EBOOK]:    { icon: FileText,       color: "bg-blue-100 text-blue-700",    label: "E-Book"        },
  [TYPES.EJOURNAL]: { icon: BookMarked,     color: "bg-purple-100 text-purple-700",label: "E-Journal"     },
  [TYPES.THESIS]:   { icon: GraduationCap,  color: "bg-yellow-100 text-yellow-700",label: "Thesis"        },
  [TYPES.MAGAZINE]: { icon: Newspaper,      color: "bg-pink-100 text-pink-700",    label: "Magazine"      },
};

const EMPTY = {
  title: "", author: "", category: "", publishedYear: "", description: "",
  coverImage: "", materialType: TYPES.PHYSICAL, status: "available",
  // physical
  isbn: "", quantity: "", shelfLocation: "", publisher: "",
  // digital
  fileUrl: "", accessUrl: "",
  // e-journal
  journalName: "", volume: "", issue: "", issn: "",
  // thesis
  abstract: "", program: "", department: "", advisor: "", degree: "",
  // magazine
  magazineName: "", articleDoi: "", pageRange: "",
};

/* ── small helpers ─────────────────────────────── */
const Label = ({ children, required }) => (
  <label className="block text-xs font-semibold text-gray-600 mb-1">
    {children}{required && <span className="text-red-400 ml-0.5">*</span>}
  </label>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#227325] focus:ring-1 focus:ring-[#227325] outline-none transition-all ${className}`}
    {...props}
  />
);

const Select = ({ children, className = "", ...props }) => (
  <select
    className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#227325] focus:ring-1 focus:ring-[#227325] outline-none bg-white ${className}`}
    {...props}
  >
    {children}
  </select>
);

const Textarea = ({ className = "", ...props }) => (
  <textarea
    rows={3}
    className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#227325] focus:ring-1 focus:ring-[#227325] outline-none resize-none ${className}`}
    {...props}
  />
);

const SectionTitle = ({ children }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{children}</span>
    <div className="flex-1 h-px bg-gray-100" />
  </div>
);

/* ── material type selector card ───────────────── */
const TypeCard = ({ type, selected, onSelect }) => {
  const { icon: Icon, color, label } = TYPE_META[type];
  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
        selected
          ? "border-[#227325] bg-green-50 shadow-sm"
          : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
    >
      <span className={`p-2 rounded-lg ${selected ? "bg-[#227325] text-white" : color}`}>
        <Icon size={16} />
      </span>
      <span className={`text-xs font-semibold leading-tight ${selected ? "text-[#227325]" : "text-gray-600"}`}>
        {label}
      </span>
    </button>
  );
};

/* ══════════════════════════════════════════════════ */
const Books = () => {
  const { user } = useAuth();
  const [books, setBooks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook]   = useState(null); // null = add mode, object = edit mode
  const [form, setForm]           = useState(EMPTY);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [pdfFile, setPdfFile]     = useState(null);
  const coverRef = useRef();
  const pdfRef   = useRef();

  // filters
  const [search, setSearch]               = useState("");
  const [filterStatus, setFilterStatus]   = useState("all");
  const [filterType, setFilterType]       = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/books");
      setBooks(data.books);
    } catch { setError("Failed to load books."); }
    finally  { setLoading(false); }
  };

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const handleChange = (e) => set(e.target.name, e.target.value);

  const handleTypeSelect = (type) => {
    setForm({ ...EMPTY, materialType: type });
    setCoverFile(null); setCoverPreview(""); setPdfFile(null);
  };

  // Open edit modal pre-filled with existing book data
  const openEdit = (book) => {
    setEditBook(book);
    setForm({
      title:        book.title        ?? "",
      author:       book.author       ?? "",
      category:     book.category     ?? "",
      publishedYear:book.publishedYear?? "",
      description:  book.description  ?? "",
      coverImage:   book.coverImage   ?? "",
      materialType: book.materialType ?? TYPES.PHYSICAL,
      status:       book.status       ?? "available",
      isbn:         book.isbn         ?? "",
      quantity:     book.quantity     ?? "",
      shelfLocation:book.shelfLocation?? "",
      publisher:    book.publisher    ?? "",
      fileUrl:      book.fileUrl      ?? "",
      accessUrl:    book.accessUrl    ?? "",
      journalName:  book.journalName  ?? "",
      volume:       book.volume       ?? "",
      issue:        book.issue        ?? "",
      issn:         book.issn         ?? "",
      abstract:     book.abstract     ?? "",
      program:      book.program      ?? "",
      department:   book.department   ?? "",
      advisor:      book.advisor      ?? "",
      degree:       book.degree       ?? "",
      magazineName: book.magazineName ?? "",
      articleDoi:   book.articleDoi   ?? "",
      pageRange:    book.pageRange    ?? "",
    });
    setCoverFile(null);
    setCoverPreview(book.coverImage ?? "");
    setPdfFile(null);
    setFormError("");
    setShowModal(true);
  };

  const handleCoverChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  };

  const handlePdfChange = (e) => {
    const f = e.target.files[0];
    if (f) setPdfFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      let coverImageUrl = form.coverImage;
      let fileUrl = form.fileUrl;

      if (coverFile) {
        const fd = new FormData();
        fd.append("cover", coverFile);
        const { data } = await api.post("/upload/cover", fd, { headers: { "Content-Type": "multipart/form-data" } });
        coverImageUrl = data.url;
      }

      if (pdfFile) {
        const fd = new FormData();
        fd.append("pdf", pdfFile);
        const { data } = await api.post("/upload/pdf", fd, { headers: { "Content-Type": "multipart/form-data" } });
        fileUrl = data.url;
      }

      const payload = {
        ...form,
        coverImage: coverImageUrl,
        fileUrl,
        publishedYear: Number(form.publishedYear),
        quantity: form.quantity ? Number(form.quantity) : null,
      };

      if (editBook) {
        await api.put(`/books/${editBook.id}`, payload);
      } else {
        await api.post("/books", payload);
      }

      closeModal();
      fetchBooks();
    } catch (err) {
      setFormError(err.response?.data?.message || `Failed to ${editBook ? "update" : "add"} resource.`);
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditBook(null);
    setForm(EMPTY);
    setCoverFile(null); setCoverPreview(""); setPdfFile(null);
    setFormError("");
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this resource?")) return;
    try {
      await api.delete(`/books/${id}`);
      setBooks((p) => p.filter((b) => b.id !== id));
    } catch { alert("Failed to delete."); }
  };

  /* ── filtered list ── */
  const categories = useMemo(
    () => ["all", ...Array.from(new Set(books.map((b) => b.category).filter(Boolean)))],
    [books]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return books.filter((b) => {
      const matchSearch = !q || b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.isbn?.toLowerCase().includes(q);
      const matchStatus   = filterStatus   === "all" || b.status       === filterStatus;
      const matchType     = filterType     === "all" || b.materialType === filterType;
      const matchCategory = filterCategory === "all" || b.category     === filterCategory;
      return matchSearch && matchStatus && matchType && matchCategory;
    });
  }, [books, search, filterStatus, filterType, filterCategory]);

  const hasFilters = search || filterStatus !== "all" || filterType !== "all" || filterCategory !== "all";
  const type = form.materialType;

  const sel = "rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#227325] bg-white";

  /* ── dynamic form sections ── */
  const renderFormFields = () => (
    <div className="space-y-6">

      {/* ── Basic Info ── */}
      <div>
        <SectionTitle>Basic Information</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label required>Title</Label>
            <Input name="title" value={form.title} onChange={handleChange} placeholder="Enter full title..." required />
          </div>
          <div>
            <Label required>{type === TYPES.THESIS ? "Researcher / Author" : "Author / Editor"}</Label>
            <Input name="author" value={form.author} onChange={handleChange} placeholder="Full name..." required />
          </div>
          <div>
            <Label required>Category / Subject</Label>
            <Input name="category" value={form.category} onChange={handleChange} placeholder="e.g. Computer Science" required />
          </div>
          <div>
            <Label required>Year Published</Label>
            <Input name="publishedYear" type="number" value={form.publishedYear} onChange={handleChange} placeholder="e.g. 2023" min="1900" max="2099" required />
          </div>
          {type !== TYPES.THESIS && (
            <div>
              <Label>Publisher</Label>
              <Input name="publisher" value={form.publisher} onChange={handleChange} placeholder="Publisher name..." />
            </div>
          )}
        </div>
      </div>

      {/* ── Physical Book fields ── */}
      {type === TYPES.PHYSICAL && (
        <div>
          <SectionTitle>Physical Copy Details</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>ISBN</Label>
              <Input name="isbn" value={form.isbn} onChange={handleChange} placeholder="e.g. 978-3-16-148410-0" required />
            </div>
            <div>
              <Label required>Quantity</Label>
              <Input name="quantity" type="number" value={form.quantity} onChange={handleChange} placeholder="Number of copies" min="1" required />
            </div>
            <div>
              <Label>Shelf Location</Label>
              <Input name="shelfLocation" value={form.shelfLocation} onChange={handleChange} placeholder="e.g. Section A, Row 3" />
            </div>
            <div>
              <Label>Status</Label>
              <Select name="status" value={form.status} onChange={handleChange}>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* ── E-Book fields ── */}
      {type === TYPES.EBOOK && (
        <div>
          <SectionTitle>Digital Content</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>ISBN / E-ISBN</Label>
              <Input name="isbn" value={form.isbn} onChange={handleChange} placeholder="e.g. 978-3-16-148410-0" />
            </div>
            <div>
              <Label>External Access URL</Label>
              <Input name="accessUrl" value={form.accessUrl} onChange={handleChange} placeholder="https://..." />
            </div>
            <div className="sm:col-span-2">
              <Label>Upload PDF File</Label>
              <div
                onClick={() => pdfRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center cursor-pointer hover:border-[#227325] transition-colors"
              >
                <Upload size={20} className="mx-auto mb-1 text-gray-400" />
                <p className="text-xs text-gray-500">{pdfFile ? pdfFile.name : "Click to upload PDF"}</p>
              </div>
              <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfChange} />
            </div>
          </div>
        </div>
      )}

      {/* ── E-Journal fields ── */}
      {type === TYPES.EJOURNAL && (
        <div>
          <SectionTitle>Journal Details</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label required>Journal Name</Label>
              <Input name="journalName" value={form.journalName} onChange={handleChange} placeholder="e.g. International Journal of Computer Science" required />
            </div>
            <div>
              <Label>Volume</Label>
              <Input name="volume" value={form.volume} onChange={handleChange} placeholder="e.g. Vol. 12" />
            </div>
            <div>
              <Label>Issue</Label>
              <Input name="issue" value={form.issue} onChange={handleChange} placeholder="e.g. Issue 3" />
            </div>
            <div>
              <Label>ISSN</Label>
              <Input name="issn" value={form.issn} onChange={handleChange} placeholder="e.g. 1234-5678" />
            </div>
            <div>
              <Label>Access URL</Label>
              <Input name="accessUrl" value={form.accessUrl} onChange={handleChange} placeholder="https://..." />
            </div>
          </div>
        </div>
      )}

      {/* ── Thesis fields ── */}
      {type === TYPES.THESIS && (
        <div>
          <SectionTitle>Thesis / Dissertation Details</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>Degree</Label>
              <Select name="degree" value={form.degree} onChange={handleChange} required>
                <option value="">Select degree...</option>
                <option>Bachelor's</option>
                <option>Master's</option>
                <option>Doctorate (PhD)</option>
              </Select>
            </div>
            <div>
              <Label required>Program</Label>
              <Input name="program" value={form.program} onChange={handleChange} placeholder="e.g. BS Computer Science" required />
            </div>
            <div>
              <Label>Department</Label>
              <Input name="department" value={form.department} onChange={handleChange} placeholder="e.g. College of Engineering" />
            </div>
            <div>
              <Label>Adviser</Label>
              <Input name="advisor" value={form.advisor} onChange={handleChange} placeholder="Adviser full name..." />
            </div>
            <div className="sm:col-span-2">
              <Label>Abstract</Label>
              <Textarea name="abstract" value={form.abstract} onChange={handleChange} placeholder="Brief abstract of the thesis..." rows={4} />
            </div>
            <div className="sm:col-span-2">
              <Label>Upload PDF</Label>
              <div
                onClick={() => pdfRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center cursor-pointer hover:border-[#227325] transition-colors"
              >
                <Upload size={20} className="mx-auto mb-1 text-gray-400" />
                <p className="text-xs text-gray-500">{pdfFile ? pdfFile.name : "Click to upload PDF"}</p>
              </div>
              <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfChange} />
            </div>
          </div>
        </div>
      )}

      {/* ── Magazine / Article fields ── */}
      {type === TYPES.MAGAZINE && (
        <div>
          <SectionTitle>Magazine / Article Details</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label required>Magazine / Publication Name</Label>
              <Input name="magazineName" value={form.magazineName} onChange={handleChange} placeholder="e.g. National Geographic" required />
            </div>
            <div>
              <Label>DOI</Label>
              <Input name="articleDoi" value={form.articleDoi} onChange={handleChange} placeholder="e.g. 10.1000/xyz123" />
            </div>
            <div>
              <Label>Page Range</Label>
              <Input name="pageRange" value={form.pageRange} onChange={handleChange} placeholder="e.g. 12–25" />
            </div>
            <div>
              <Label>Access URL</Label>
              <Input name="accessUrl" value={form.accessUrl} onChange={handleChange} placeholder="https://..." />
            </div>
          </div>
        </div>
      )}

      {/* ── Cover Image ── */}
      <div>
        <SectionTitle>Cover Image</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <div>
            <Label>Image URL</Label>
            <Input name="coverImage" value={form.coverImage} onChange={handleChange} placeholder="https://..." />
            <p className="text-xs text-gray-400 mt-1">Or upload below</p>
            <div
              onClick={() => coverRef.current?.click()}
              className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-[#227325] transition-colors"
            >
              <Upload size={16} className="mx-auto mb-1 text-gray-400" />
              <p className="text-xs text-gray-500">{coverFile ? coverFile.name : "Upload cover image"}</p>
            </div>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>
          {coverPreview && (
            <div className="relative">
              <img src={coverPreview} alt="Cover preview" className="h-36 w-full object-cover rounded-lg border border-gray-200" />
              <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(""); set("coverImage", ""); }}
                className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow text-red-500 hover:text-red-700">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Description ── */}
      <div>
        <SectionTitle>Description</SectionTitle>
        <Textarea name="description" value={form.description} onChange={handleChange} placeholder="Brief description or summary..." rows={3} />
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Library Resources</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage books, e-books, journals, theses, and more</p>
        </div>
        {(user?.role === "admin" || user?.role === "librarian") && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-md bg-[#227325] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus size={16} /> Add Resource
          </button>
        )}
      </div>

      {/* Table card */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <h2 className="text-base font-semibold text-gray-800 flex-1">All Resources</h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search title, author, ISBN..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#227325] w-56" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={sel}>
            <option value="all">All Types</option>
            {Object.values(TYPES).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={sel}>
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={sel}>
            {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
          </select>
          {hasFilters && (
            <button onClick={() => { setSearch(""); setFilterStatus("all"); setFilterType("all"); setFilterCategory("all"); }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors">
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {!loading && !error && <p className="text-xs text-gray-400 mb-3">Showing {filtered.length} of {books.length} resources</p>}
        {loading && <p className="text-sm text-gray-400">Loading...</p>}
        {error   && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Copies</th>
                  <th className="px-4 py-3">Status</th>
                  {(user?.role === "admin" || user?.role === "librarian") && <th className="px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((book) => {
                  const meta = TYPE_META[book.materialType] || TYPE_META[TYPES.PHYSICAL];
                  const Icon = meta.icon;
                  return (
                    <tr key={book.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-xs">
                        <p className="truncate">{book.title}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{book.author}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                          <Icon size={11} /> {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{book.category}</td>
                      <td className="px-4 py-3 text-gray-600">{book.publishedYear}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {book.quantity != null ? `${book.availableCopies}/${book.quantity}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {book.materialType === TYPES.PHYSICAL ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${book.status === "available" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                            {book.status}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      {(user?.role === "admin" || user?.role === "librarian") && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <IconBtn onClick={() => openEdit(book)} title="Edit" icon={Pencil} color="blue" />
                            <IconBtn onClick={() => handleDelete(book.id)} title="Delete" icon={Trash2} color="red" />
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <BookOpen size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">{hasFilters ? "No resources match your filters." : "No resources found."}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Add Resource Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {editBook ? "Edit Resource" : "Add Library Resource"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editBook ? `Editing: ${editBook.title}` : "Select a resource type then fill in the details"}
                </p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <form id="add-resource-form" onSubmit={handleSubmit} className="space-y-6">

                {formError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {formError}
                  </div>
                )}

                {/* Material type selector — hidden in edit mode (type is fixed) */}
                {!editBook && (
                  <div>
                    <SectionTitle>Resource Type</SectionTitle>
                    <div className="grid grid-cols-5 gap-2">
                      {Object.values(TYPES).map((t) => (
                        <TypeCard key={t} type={t} selected={type === t} onSelect={handleTypeSelect} />
                      ))}
                    </div>
                  </div>
                )}

                {renderFormFields()}
              </form>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50 rounded-b-2xl">
              <button type="button" onClick={closeModal}
                className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button type="submit" form="add-resource-form" disabled={formLoading}
                className="rounded-md bg-[#227325] px-6 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60 shadow-sm">
                {formLoading ? "Saving..." : editBook ? "Save Changes" : "Save Resource"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Books;
