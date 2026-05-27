import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle, XCircle, Home, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../api/axios";
import cvsulogo from "../assets/CvSU-Logo.webp";

const TOTAL_STEPS = 4;

/* ── progress bar ── */
const ProgressBar = ({ step }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div
      className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
      style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
    />
  </div>
);

/* ── step dots ── */
const StepDots = ({ step }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
      <div
        key={i}
        className={`rounded-full transition-all duration-300 ${
          i + 1 < step
            ? "w-3 h-3 bg-green-600"
            : i + 1 === step
            ? "w-4 h-4 bg-green-600 ring-4 ring-green-100"
            : "w-3 h-3 bg-gray-300"
        }`}
      />
    ))}
  </div>
);

/* ── validated field wrapper ── */
const Field = ({ label, error, valid, children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 sm:gap-6 items-start">
    <label className="font-bold text-gray-700 text-sm pt-2.5">{label}</label>
    <div>
      {children}
      {valid && !error && (
        <p className="text-green-600 text-xs mt-1.5 flex items-center gap-1">
          <CheckCircle size={12} /> {label} is valid!
        </p>
      )}
      {error && (
        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
          <XCircle size={12} /> {error}
        </p>
      )}
    </div>
  </div>
);

const inputBase = (err, ok) =>
  `w-full border rounded px-3 py-2.5 text-sm outline-none transition-colors pr-9 ${
    err ? "border-red-400 focus:border-red-500 bg-red-50/30"
    : ok ? "border-green-500 focus:border-green-600"
    : "border-gray-300 focus:border-green-600"
  }`;

/* ══════════════════════════════════════════════ */
const CreateProfile = () => {
  const { user, setUserFromOAuth } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    sex: "", address: "", mobileNumber: "", userType: "", studentNumber: "", program: "",
  });
  const [touched, setTouched] = useState({});

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setTouched((p) => ({ ...p, [field]: true }));
  };

  const errors = {
    sex:          !form.sex ? "Sex is required!" : "",
    address:      !form.address.trim() ? "Address is required!" : "",
    mobileNumber: !form.mobileNumber.trim()
      ? "Mobile number is required!"
      : !/^\d{10}$/.test(form.mobileNumber.replace(/\s/g, ""))
      ? "Enter a valid 10-digit number (e.g. 9208826429)"
      : "",
    userType:     !form.userType ? "User Type is required!" : "",
    program:      form.userType === "Student" && !form.program.trim()
      ? "Program is required for students!" : "",
    studentNumber: form.userType === "Student" && !form.studentNumber.trim()
      ? "Student Number is required!" : "",
  };

  const isValid  = (f) => touched[f] && !errors[f];
  const hasError = (f) => touched[f] && !!errors[f];

  const step2Valid = !errors.sex && !errors.address && !errors.mobileNumber;
  const step3Valid = !errors.userType && !errors.program;
  const step4Valid = !errors.studentNumber;

  const canNext = () => {
    if (step === 1) return consent;
    if (step === 2) return step2Valid;
    if (step === 3) return step3Valid;
    if (step === 4) return step4Valid;
    return false;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.patch("/users/profile/complete", {
        sex: form.sex,
        address: form.address,
        mobileNumber: `+63${form.mobileNumber}`,
        userType: form.userType,
        studentNumber: form.studentNumber || null,
        program: form.program || null,
      });
      const updatedUser = { ...user, ...data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUserFromOAuth(token, updatedUser);
      navigate("/student/dashboard", { replace: true });
    } catch (err) {
      toast(err.response?.data?.message || "Failed to save profile. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ["", "PRIVACY NOTICE", "PERSONAL INFORMATION", "UNIVERSITY INFORMATION", "REVIEW INFORMATION"];

  /* ── step content ── */
  const renderStep = () => {
    switch (step) {

      case 1:
        return (
          <div className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-sm text-gray-700 space-y-5 max-h-96 overflow-y-auto leading-7 shadow-sm">
              <p className="italic text-justify">
                <strong>Cavite State University (CvSU)</strong> is required by law to process your
                personal information and sensitive personal information in order to safeguard academic
                freedom, uphold your right to quality education, and protect your right to data privacy
                in conformity with Republic Act No. 10173, otherwise known as the Data Privacy Act of
                2012, and its implementing rules and regulations. The said law can be viewed via{" "}
                <a
                  href="https://www.officialgazette.gov.ph/2012/08/15/republic-act-no-10173/"
                  target="_blank" rel="noreferrer"
                  className="text-blue-600 underline break-all"
                >
                  https://www.officialgazette.gov.ph/2012/08/15/republic-act-no-10173/
                </a>
              </p>
              <p>
                The following personal data will be collected and processed for the purpose of
                Integrated Library System registration and for your availment of the library services:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 pl-2">
                <li>Full Name</li>
                <li>Sex</li>
                <li>Address</li>
                <li>Mobile Number</li>
                <li>Email Address</li>
                <li>Campus / Office</li>
                <li>Student Number / Employee ID</li>
                <li>Position</li>
              </ul>
              <p className="text-xs text-gray-500 leading-relaxed">
                The full text of the University's Data Privacy Statement can be viewed in the official
                website (
                <a href="https://www.cvsu.edu.ph" target="_blank" rel="noreferrer" className="text-blue-600 underline">
                  www.cvsu.edu.ph
                </a>
                ). For more information, you may contact us at{" "}
                <a href="mailto:cvsulibrary@cvsu.edu.ph" className="text-blue-600 underline">
                  cvsulibrary@cvsu.edu.ph
                </a>
              </p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-5 py-4 shadow-sm hover:border-green-400 transition-colors">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-green-600"
              />
              <span className="font-medium">I consent to the processing of my personal data for the purposes stated above.</span>
            </label>
          </div>
        );

      case 2:
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-7 shadow-sm">
            <Field label="Sex" error={hasError("sex") ? errors.sex : ""} valid={isValid("sex")}>
              <div className="relative">
                <select value={form.sex} onChange={(e) => set("sex", e.target.value)} className={inputBase(hasError("sex"), isValid("sex"))}>
                  <option value="">Select sex...</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
                {isValid("sex")  && <CheckCircle size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />}
                {hasError("sex") && <XCircle    size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none" />}
              </div>
            </Field>

            <Field label="Address" error={hasError("address") ? errors.address : ""} valid={isValid("address")}>
              <div className="relative">
                <textarea
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  rows={4}
                  placeholder="Enter your complete address..."
                  className={`${inputBase(hasError("address"), isValid("address"))} resize-none`}
                />
                {isValid("address")  && <CheckCircle size={15} className="absolute right-2.5 top-3 text-green-500 pointer-events-none" />}
                {hasError("address") && <XCircle    size={15} className="absolute right-2.5 top-3 text-red-400 pointer-events-none" />}
              </div>
            </Field>

            <Field label="Mobile Number" error={hasError("mobileNumber") ? errors.mobileNumber : ""} valid={isValid("mobileNumber")}>
              <div className="flex">
                <span className="border border-r-0 border-gray-300 rounded-l px-3 py-2.5 text-sm bg-gray-50 text-gray-600 shrink-0 font-medium">+63</span>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={form.mobileNumber}
                    onChange={(e) => set("mobileNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9208826429"
                    className={`w-full border rounded-r px-3 py-2.5 text-sm outline-none transition-colors pr-9 ${
                      hasError("mobileNumber") ? "border-red-400 bg-red-50/30"
                      : isValid("mobileNumber") ? "border-green-500"
                      : "border-gray-300 focus:border-green-600"
                    }`}
                  />
                  {isValid("mobileNumber")  && <CheckCircle size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />}
                  {hasError("mobileNumber") && <XCircle    size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none" />}
                </div>
              </div>
            </Field>
          </div>
        );

      case 3:
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-7 shadow-sm">
            <Field label="User Type" error={hasError("userType") ? errors.userType : ""} valid={isValid("userType")}>
              <div className="relative">
                <select value={form.userType} onChange={(e) => set("userType", e.target.value)} className={inputBase(hasError("userType"), isValid("userType"))}>
                  <option value="">Select user type...</option>
                  <option>Student</option>
                  <option>Faculty (Academic)</option>
                  <option>Faculty (Non-Academic)</option>
                  <option>Staff</option>
                  <option>Alumni</option>
                </select>
                {isValid("userType")  && <CheckCircle size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />}
                {hasError("userType") && <XCircle    size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none" />}
              </div>
            </Field>

            {/* Program — only required for students */}
            {form.userType === "Student" && (
              <Field label="Program" error={hasError("program") ? errors.program : ""} valid={isValid("program")}>
                <div className="relative">
                  <select
                    value={form.program}
                    onChange={(e) => set("program", e.target.value)}
                    className={inputBase(hasError("program"), isValid("program"))}
                  >
                    <option value="">Select your program...</option>
                    <option>Bachelor of Science in Computer Science (BSCS)</option>
                    <option>Bachelor of Science in Information Technology (BSIT)</option>
                    <option>Bachelor of Science in Computer Engineering (BSCpE)</option>
                    <option>Bachelor of Science in Business Administration - Marketing Management (BSBA-MM)</option>
                    <option>Bachelor of Science in Business Administration - Human Resource Management (BSBA-HRM)</option>
                    <option>Bachelor of Science in Hospitality Management (BSHM)</option>
                    <option>Bachelor of Science in Industrial Technology (BSIndT)</option>
                    <option>Bachelor of Secondary Education - English (BSEd-English)</option>
                    <option>Bachelor of Secondary Education - Math (BSEd-Math)</option>
                    <option>Bachelor of Secondary Education - Science (BSEd-Science)</option>
                  </select>
                  {isValid("program")  && <CheckCircle size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />}
                  {hasError("program") && <XCircle    size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none" />}
                </div>
              </Field>
            )}
          </div>
        );

      case 4:
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-7 shadow-sm">
            <Field
              label={form.userType === "Student" ? "Student Number" : "Employee ID"}
              error={hasError("studentNumber") ? errors.studentNumber : ""}
              valid={isValid("studentNumber")}
            >
              <div className="relative">
                <input
                  type="text"
                  value={form.studentNumber}
                  onChange={(e) => set("studentNumber", e.target.value)}
                  placeholder={form.userType === "Student" ? "e.g. 2021-00123" : "Employee ID..."}
                  className={inputBase(hasError("studentNumber"), isValid("studentNumber"))}
                />
                {isValid("studentNumber")  && <CheckCircle size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />}
                {hasError("studentNumber") && <XCircle    size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none" />}
              </div>
            </Field>

            {/* Review summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-3">
              <p className="font-bold text-gray-700 text-sm mb-3">Review your information</p>
              <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2.5 text-sm">
                <span className="text-gray-400 font-medium">Full Name</span>   <span className="text-gray-800">{user?.fullName}</span>
                <span className="text-gray-400 font-medium">Email</span>        <span className="text-gray-800">{user?.email}</span>
                <span className="text-gray-400 font-medium">Sex</span>          <span className="text-gray-800">{form.sex}</span>
                <span className="text-gray-400 font-medium">Address</span>      <span className="text-gray-800">{form.address}</span>
                <span className="text-gray-400 font-medium">Mobile</span>       <span className="text-gray-800">+63{form.mobileNumber}</span>
                <span className="text-gray-400 font-medium">User Type</span>    <span className="text-gray-800">{form.userType}</span>
                {form.program && <>
                  <span className="text-gray-400 font-medium">Program</span>
                  <span className="text-gray-800">{form.program}</span>
                </>}
                {form.studentNumber && <>
                  <span className="text-gray-400 font-medium">{form.userType === "Student" ? "Student No." : "Employee ID"}</span>
                  <span className="text-gray-800">{form.studentNumber}</span>
                </>}
              </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src={cvsulogo} alt="CvSU" className="w-11 h-11 object-contain" />
          <div>
            <h1 className="text-base font-bold text-gray-800 leading-tight">Create Profile</h1>
            <p className="text-xs text-gray-400">Cavite State University — E-Library System</p>
          </div>
        </div>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link to="/" className="flex items-center gap-1 hover:text-green-700 transition-colors font-medium">
            <Home size={14} /> Home
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-gray-400">Profile</span>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-green-700 font-semibold">Create Profile</span>
        </nav>
      </div>

      <div className="flex-1 flex justify-center px-4 py-10">
        <div className="w-full max-w-3xl space-y-6">

          {/* Step header */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                Steps: {step} of {TOTAL_STEPS}
              </p>
              <h2 className="text-2xl font-bold text-gray-800">{stepLabels[step]}</h2>
            </div>
            <StepDots step={step} />
          </div>

          <ProgressBar step={step} />

          {/* Step content */}
          {renderStep()}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors px-2 py-1"
              >
                ← Back
              </button>
            ) : (
              <Link to="/" className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors px-2 py-1">
                ← Back to Home
              </Link>
            )}

            {step < TOTAL_STEPS ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-md text-sm font-semibold transition-colors shadow-sm"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !canNext()}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-md text-sm font-semibold transition-colors shadow-sm"
              >
                {submitting ? "Saving..." : "Submit"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProfile;
