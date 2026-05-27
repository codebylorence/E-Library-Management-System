import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Users, BookMarked, Monitor, QrCode, ShieldCheck,
  Clock, ChevronRight, Search, Menu, X, ArrowRight,
  MapPin, Phone, Mail, ExternalLink,
  GraduationCap, Wifi, Printer, Star,
} from "lucide-react";
import cvsulogo from "../assets/CvSU-Logo.webp";
import libraryPhoto from "../assets/Library-picture.jpg";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

/* ── Scroll reveal hook ── */
const useReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

/* ── Animated counter ── */
const Counter = ({ target, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const [ref, visible] = useReveal();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 20);
    return () => clearInterval(timer);
  }, [visible, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ── Navbar ── */
const LandingNavbar = ({ navigate, user }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const links = ["Home","Features","Catalog","Facilities","Announcements","Contact"];
  const scrollTo = (id) => {
    setMobileOpen(false);
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: "smooth" });
  };
  const dashboardPath = user
    ? (user.role === "admin" || user.role === "librarian" ? "/admin/dashboard" : "/student/dashboard")
    : "/login";

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-[#1a5c1d]/95 backdrop-blur-md shadow-lg" : "bg-[#227325]"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">
        <div className="flex items-center gap-3 min-w-0">
          <img src={cvsulogo} alt="CvSU" className="w-10 h-10 md:w-12 md:h-12 object-contain shrink-0" />
          <div className="leading-tight min-w-0 hidden sm:block">
            <p className="text-white font-bold text-sm md:text-base truncate">Cavite State University - Carmona</p>
            <p className="text-white/80 text-xs truncate">E-Library Management System</p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-6">
          {links.map(l => (
            <button key={l} onClick={() => scrollTo(l)} className="text-white/90 hover:text-white text-sm font-medium transition-colors hover:underline underline-offset-4">
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(dashboardPath)}
            className="hidden sm:flex items-center gap-2 bg-white text-[#227325] text-sm font-bold px-4 py-2 rounded-lg hover:bg-green-50 transition-colors shadow-sm"
          >
            {user ? "Dashboard" : "Sign In"}
          </button>
          <button onClick={() => setMobileOpen(o => !o)} className="lg:hidden text-white p-1">
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden bg-[#1a5c1d] border-t border-white/10 px-4 py-4 space-y-1">
          {links.map(l => (
            <button key={l} onClick={() => scrollTo(l)} className="block w-full text-left text-white/90 hover:text-white hover:bg-white/10 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors">
              {l}
            </button>
          ))}
          <button onClick={() => navigate(dashboardPath)} className="w-full mt-2 bg-white text-[#227325] font-bold text-sm px-4 py-2.5 rounded-lg">
            {user ? "Dashboard" : "Sign In"}
          </button>
        </div>
      )}
    </nav>
  );
};

/* ── Section wrapper with reveal ── */
const Section = ({ id, className = "", children }) => {
  const [ref, visible] = useReveal();
  return (
    <section id={id} ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </section>
  );
};

/* ── Main component ── */
const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ books: 0, users: 0, journals: 0, visitors: 0 });
  const [settings, setSettings] = useState({
    hoursMonFri:   "7:30 AM – 5:00 PM",
    hoursSaturday: "Closed",
    hoursSunday:   "Closed",
    address:       "Carmona, Cavite, Philippines",
    phone:         "(046) 123-4567",
    email:         "cvsulibrary@cvsu.edu.ph",
    website:       "https://www.cvsu.edu.ph",
    facebook:      "",
    announcement1Title: "Library Hours",
    announcement1Body:  "Monday – Thursday: 7:30 AM – 5:00 PM. Friday to Sunday: Closed.",
    announcement2Title: "Book Week Celebration",
    announcement2Body:  "Join us for our annual Book Week! Activities include reading contests, book exhibits, and author talks.",
    announcement3Title: "System Maintenance",
    announcement3Body:  "The e-library system will undergo scheduled maintenance every Sunday from 12:00 AM – 4:00 AM.",
  });

  useEffect(() => {
    // Fetch public settings
    api.get("/settings").then(({ data }) => setSettings(data.settings)).catch(() => {});

    // Only fetch books publicly — skip protected endpoints to avoid 401 loops
    api.get("/books")
      .then(b => setStats(prev => ({
        ...prev,
        books: b.data.books?.length ?? 0,
        journals: b.data.books?.filter(x => x.materialType === "E-Journals").length ?? 0,
      }))).catch(() => {});

    // Only fetch users/attendance if logged in as admin/librarian
    if (user && (user.role === "admin" || user.role === "librarian")) {
      api.get("/users")
        .then(u => setStats(prev => ({ ...prev, users: u.data.users?.length ?? 0 })))
        .catch(() => {});
      api.get("/attendance/stats")
        .then(a => setStats(prev => ({ ...prev, visitors: a.data.todayTotal ?? 0 })))
        .catch(() => {});
    }
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/guest/catalogs?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen font-sans bg-white">
      <LandingNavbar navigate={navigate} user={user} />

      {/* ── HERO ── */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${libraryPhoto})` }} />
        <div className="absolute inset-0 bg-linear-to-b from-black/75 via-black/55 to-black/70" />
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto pt-20">
          <span className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/40 text-green-300 text-xs font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Next-Generation Library System
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Your Gateway to<br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-green-400 to-emerald-300">
              Infinite Knowledge
            </span>
          </h1>
          <p className="text-base md:text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed">
            Access thousands of books, journals, and digital resources at Cavite State University Carmona Campus Library.
          </p>
          <form onSubmit={handleSearch} className="w-full max-w-xl mb-8">
            <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 gap-3 shadow-xl focus-within:border-green-400 transition-colors">
              <Search size={18} className="text-white/60 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search books, authors, journals..."
                className="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none"
              />
              <button type="submit" className="bg-green-500 hover:bg-green-400 text-white text-sm font-semibold px-4 py-1.5 rounded-xl transition-colors shrink-0">
                Search
              </button>
            </div>
          </form>
          
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 animate-bounce">
          <span className="text-xs">Scroll</span>
          <ChevronRight size={16} className="rotate-90" />
        </div>
      </section>

      {/* ── STATS ── */}
      <Section id="stats" className="bg-[#227325] py-14 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: BookOpen,    label: "Total Books",      value: stats.books,    suffix: "+" },
            { icon: Users,       label: "Registered Users", value: stats.users,    suffix: "+" },
            { icon: BookMarked,  label: "E-Journals",       value: stats.journals, suffix: "+" },
            { icon: Monitor,     label: "Today's Visitors", value: stats.visitors, suffix: ""  },
          ].map(({ icon: Icon, label, value, suffix }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="p-3 bg-white/15 rounded-xl mb-1">
                <Icon size={22} className="text-white" />
              </div>
              <p className="text-3xl font-extrabold text-white">
                <Counter target={value} suffix={suffix} />
              </p>
              <p className="text-green-200 text-xs font-medium uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FEATURES ── */}
      <Section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-green-600 text-xs font-bold tracking-widest uppercase mb-2">What We Offer</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Smart Library Features</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm">Everything you need for a modern, efficient library experience.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: QrCode,       title: "QR Attendance",        desc: "Students scan their personal QR code at the entrance — no internet needed on their device." },
              { icon: BookMarked,   title: "Smart Borrowing",       desc: "Request books online, get librarian approval, and track due dates with automatic fine calculation." },
              { icon: Monitor,      title: "Digital Resources",     desc: "Access e-books, e-journals, theses, and magazines from anywhere on campus." },
              { icon: ShieldCheck,  title: "Secure CvSU Login",     desc: "Sign in with your official @cvsu.edu.ph Google account for seamless, secure access." },
              { icon: Clock,        title: "Fine Management",       desc: "Automatic overdue detection with ₱5/day fine tracking and payment recording." },
              { icon: BookOpen,     title: "Real-Time Availability", desc: "See live book availability, shelf locations, and copy counts before visiting the library." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group">
                <div className="p-3 bg-green-50 rounded-xl w-fit mb-4 group-hover:bg-green-100 transition-colors">
                  <Icon size={22} className="text-[#227325]" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section id="catalog" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-green-600 text-xs font-bold tracking-widest uppercase mb-2">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">How Borrowing Works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { step: "01", icon: QrCode,      title: "Scan QR",         desc: "Show your QR code at the library entrance to log attendance." },
              { step: "02", icon: Search,      title: "Browse Catalog",  desc: "Find books online or at the library." },
              { step: "03", icon: BookOpen,    title: "Request Borrow",  desc: "Submit a borrow request from the system." },
              { step: "04", icon: ShieldCheck, title: "Get Approved",    desc: "Librarian approves when you pick up the book." },
              { step: "05", icon: Clock,       title: "Return On Time",  desc: "Return before the due date to avoid fines." },
            ].map(({ step, icon: Icon, title, desc }, i) => (
              <div key={step} className="relative flex flex-col items-center text-center p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-all">
                {i < 4 && <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-gray-300"><ChevronRight size={20} /></div>}
                <div className="w-10 h-10 rounded-full bg-[#227325] text-white text-xs font-bold flex items-center justify-center mb-3">{step}</div>
                <Icon size={20} className="text-[#227325] mb-2" />
                <p className="font-bold text-gray-800 text-sm mb-1">{title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── FACILITIES ── */}
      <Section id="facilities" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-green-600 text-xs font-bold tracking-widest uppercase mb-2">Our Space</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Library Facilities</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: BookOpen,      label: "Study Areas",        desc: "Quiet zones for focused reading" },
              { icon: Monitor,       label: "Computer Stations",  desc: "Internet-connected workstations" },
              { icon: Users,         label: "Discussion Rooms",   desc: "Group study and collaboration" },
              { icon: Wifi,          label: "Free WiFi",          desc: "High-speed campus internet" },
              { icon: Printer,       label: "Printing Services",  desc: "Print, scan, and photocopy" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group">
                <div className="p-3 bg-green-50 rounded-xl w-fit mx-auto mb-3 group-hover:bg-green-100 transition-colors">
                  <Icon size={20} className="text-[#227325]" />
                </div>
                <p className="font-bold text-gray-800 text-sm">{label}</p>
                <p className="text-gray-400 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── ANNOUNCEMENTS ── */}
      <Section id="announcements" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-green-600 text-xs font-bold tracking-widest uppercase mb-2">Stay Updated</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Announcements</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { tag: "Schedule", color: "bg-blue-100 text-blue-700",    title: settings.announcement1Title, body: settings.announcement1Body },
              { tag: "Event",    color: "bg-green-100 text-green-700",  title: settings.announcement2Title, body: settings.announcement2Body },
              { tag: "Notice",   color: "bg-yellow-100 text-yellow-700",title: settings.announcement3Title, body: settings.announcement3Body },
            ].map(({ tag, color, title, body }) => (
              <div key={title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${color} mb-3 inline-block`}>{tag}</span>
                <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── TESTIMONIALS ── */}
      <Section className="py-20 px-4 bg-[#227325]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-green-300 text-xs font-bold tracking-widest uppercase mb-2">What They Say</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Student Feedback</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Maria Santos",   role: "BS Computer Science",  text: "The QR attendance system is so convenient! I just show my phone and I'm logged in instantly." },
              { name: "Juan dela Cruz", role: "BS Education",         text: "I love being able to check book availability online before going to the library. Saves so much time!" },
              { name: "Ana Reyes",      role: "Faculty Member",       text: "The digital resources section is excellent. Access to e-journals has greatly helped my research." },
            ].map(({ name, role, text }) => (
              <div key={name} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-white/90 text-sm leading-relaxed mb-4 italic">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-400/30 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{name}</p>
                    <p className="text-green-300 text-xs">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA BANNER ── */}
      <Section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-gray-500 mb-8 text-sm">Sign in with your CvSU account to access all library features, or browse as a guest.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate("/login")} className="flex items-center justify-center gap-2 bg-[#227325] hover:bg-[#1a5c1d] text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:-translate-y-0.5">
              Sign In with CvSU <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate("/guest/catalogs")} className="flex items-center justify-center gap-2 border-2 border-[#227325] text-[#227325] hover:bg-green-50 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5">
              <BookOpen size={16} /> Browse as Guest
            </button>
          </div>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer id="contact" className="bg-gray-900 text-gray-400 pt-14 pb-6 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={cvsulogo} alt="CvSU" className="w-10 h-10 object-contain" />
              <div>
                <p className="text-white font-bold text-sm">CvSU Carmona</p>
                <p className="text-gray-500 text-xs">E-Library System</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed">Cavite State University – Carmona Campus Library provides quality academic resources to support learning and research.</p>
          </div>
          <div>
            <p className="text-white font-bold text-sm mb-4">Quick Links</p>
            <ul className="space-y-2 text-xs">
              {["Home","Features","Catalog","Facilities","Announcements"].map(l => (
                <li key={l}><button onClick={() => document.getElementById(l.toLowerCase())?.scrollIntoView({ behavior: "smooth" })} className="hover:text-green-400 transition-colors">{l}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white font-bold text-sm mb-4">Library Hours</p>
            <ul className="space-y-2 text-xs">
              <li className="flex justify-between"><span>Mon – Thu</span><span className="text-white">{settings.hoursMonFri}</span></li>
              <li className="flex justify-between"><span>Saturday</span><span className={settings.hoursSaturday?.toLowerCase() === "closed" ? "text-red-400" : "text-white"}>{settings.hoursSaturday}</span></li>
              <li className="flex justify-between"><span>Sunday</span><span className={settings.hoursSunday?.toLowerCase() === "closed" ? "text-red-400" : "text-white"}>{settings.hoursSunday}</span></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-bold text-sm mb-4">Contact Us</p>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2"><MapPin size={13} className="text-green-400 mt-0.5 shrink-0" /><span>{settings.address}</span></li>
              <li className="flex items-center gap-2"><Phone size={13} className="text-green-400 shrink-0" /><span>{settings.phone}</span></li>
              <li className="flex items-center gap-2"><Mail size={13} className="text-green-400 shrink-0" /><span>{settings.email}</span></li>
            </ul>
            <div className="flex gap-3 mt-4">
              {settings.website && (
                <a href={settings.website} target="_blank" rel="noreferrer" title="Website" className="p-2 bg-white/5 hover:bg-green-500/20 rounded-lg transition-colors">
                  <ExternalLink size={15} className="text-gray-400 hover:text-green-400" />
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} title="Email" className="p-2 bg-white/5 hover:bg-green-500/20 rounded-lg transition-colors">
                  <Mail size={15} className="text-gray-400 hover:text-green-400" />
                </a>
              )}
              {settings.phone && (
                <a href={`tel:${settings.phone}`} title="Phone" className="p-2 bg-white/5 hover:bg-green-500/20 rounded-lg transition-colors">
                  <Phone size={15} className="text-gray-400 hover:text-green-400" />
                </a>
              )}
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noreferrer" title="Facebook" className="p-2 bg-white/5 hover:bg-green-500/20 rounded-lg transition-colors">
                  {/* Facebook SVG logo */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 hover:text-green-400">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} Cavite State University – Carmona Campus. All rights reserved. E-Library Management System.
        </div>
      </footer>
    </div>
  );
};

export default Home;
