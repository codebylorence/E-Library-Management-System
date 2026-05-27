import { useState, useEffect } from "react";
import {
  Clock, MapPin, Phone, Mail, Globe,
  Save, Loader2, Megaphone, ExternalLink,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import api from "../api/axios";

/* ─── Field wrapper ─────────────────────────────────────── */
const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
    {children}
  </div>
);

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#227325]/30 focus:border-[#227325] transition-all";
const textareaCls = `${inputCls} resize-none`;

/* ─── Section card ──────────────────────────────────────── */
const Card = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
      <div className="p-2 bg-[#227325]/10 rounded-lg">
        <Icon size={16} className="text-[#227325]" />
      </div>
      <h2 className="text-sm font-bold text-gray-800">{title}</h2>
    </div>
    <div className="px-6 py-5 space-y-5">{children}</div>
  </div>
);

/* ─── Main ──────────────────────────────────────────────── */
const AdminSettings = () => {
  const toast = useToast();
  const [form,    setForm]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    api.get("/settings")
      .then(({ data }) => setForm(data.settings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/settings", form);
      setForm(data.settings);
      toast("Settings saved successfully.");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-400">
      <Loader2 size={24} className="animate-spin mr-2" /> Loading settings...
    </div>
  );

  if (!form) return (
    <div className="flex items-center justify-center py-24 text-gray-400">
      <p className="text-sm text-red-500">Failed to load settings. Make sure the backend is running and the database is synced.</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Library Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure library hours, contact details, and announcements shown on the home page.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#227325] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1a5a1d] disabled:opacity-60 transition-colors shadow-sm"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Library Hours */}
      <Card icon={Clock} title="Library Hours">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Monday – Thursday">
            <input
              type="text"
              value={form.hoursMonFri ?? ""}
              onChange={(e) => set("hoursMonFri", e.target.value)}
              placeholder="e.g. 7:00 AM – 6:00 PM"
              className={inputCls}
            />
          </Field>
          <Field label="Saturday">
            <input
              type="text"
              value={form.hoursSaturday ?? ""}
              onChange={(e) => set("hoursSaturday", e.target.value)}
              placeholder="e.g. 8:00 AM – 5:00 PM"
              className={inputCls}
            />
          </Field>
          <Field label="Sunday">
            <input
              type="text"
              value={form.hoursSunday ?? ""}
              onChange={(e) => set("hoursSunday", e.target.value)}
              placeholder="e.g. Closed"
              className={inputCls}
            />
          </Field>
        </div>
        <p className="text-xs text-gray-400 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          These hours appear in the footer and the Library Hours announcement card on the home page.
        </p>
      </Card>

      {/* Contact Details */}
      <Card icon={Phone} title="Contact Details">
        <Field label="Address" hint="Shown in the footer contact section.">
          <div className="relative">
            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
              placeholder="e.g. Carmona, Cavite, Philippines"
              className={`${inputCls} pl-9`}
            />
          </div>
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone Number">
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.phone ?? ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="e.g. (046) 123-4567"
                className={`${inputCls} pl-9`}
              />
            </div>
          </Field>
          <Field label="Email Address">
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
                placeholder="e.g. cvsulibrary@cvsu.edu.ph"
                className={`${inputCls} pl-9`}
              />
            </div>
          </Field>
          <Field label="Website URL">
            <div className="relative">
              <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                value={form.website ?? ""}
                onChange={(e) => set("website", e.target.value)}
                placeholder="e.g. https://www.cvsu.edu.ph"
                className={`${inputCls} pl-9`}
              />
            </div>
          </Field>
          <Field label="Facebook Page URL" hint="Optional">
            <div className="relative">
              <ExternalLink size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                value={form.facebook ?? ""}
                onChange={(e) => set("facebook", e.target.value)}
                placeholder="e.g. https://facebook.com/cvsucarmona"
                className={`${inputCls} pl-9`}
              />
            </div>
          </Field>
        </div>
      </Card>

      {/* Announcements */}
      <Card icon={Megaphone} title="Home Page Announcements">
        <p className="text-xs text-gray-400">These three cards appear in the Announcements section of the home page.</p>
        {[1, 2, 3].map((n) => (
          <div key={n} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Card {n}</p>
            <Field label="Title">
              <input
                type="text"
                value={form[`announcement${n}Title`] ?? ""}
                onChange={(e) => set(`announcement${n}Title`, e.target.value)}
                placeholder="Announcement title..."
                className={inputCls}
              />
            </Field>
            <Field label="Body">
              <textarea
                rows={3}
                value={form[`announcement${n}Body`] ?? ""}
                onChange={(e) => set(`announcement${n}Body`, e.target.value)}
                placeholder="Announcement content..."
                className={textareaCls}
              />
            </Field>
          </div>
        ))}
      </Card>

      {/* Save button (bottom) */}
      <div className="flex justify-end pb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#227325] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#1a5a1d] disabled:opacity-60 transition-colors shadow-sm"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
