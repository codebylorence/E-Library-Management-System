import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import libraryPhoto from "../assets/Library-picture.jpg";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <main
        id="home"
        className="relative grow flex items-center justify-center min-h-screen w-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${libraryPhoto})` }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 sm:bg-linear-to-b sm:from-black/70 sm:to-black/40" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
          <span className="text-green-400 font-bold tracking-[0.2em] text-xs md:text-sm mb-4 uppercase">
            Next-Generation Library System
          </span>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Expand your <br className="hidden sm:block" />
            <span className="text-green-400">knowledge.</span>
          </h2>

          <p className="text-base md:text-xl text-gray-200 mb-10 max-w-2xl leading-relaxed">
            Access thousands of books, journals, and digital resources. Manage your borrows,
            reserve titles, and explore our curated collections instantly.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={() => navigate("/catalogs")}
              className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-[0_0_15px_rgba(22,163,74,0.5)] hover:shadow-[0_0_25px_rgba(22,163,74,0.7)] flex items-center justify-center gap-2 w-full sm:w-auto border border-green-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Explore Catalogs
            </button>

            <button className="bg-transparent hover:bg-white/10 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all border-2 border-gray-300 hover:border-white flex items-center justify-center w-full sm:w-auto">
              View Amenities
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
