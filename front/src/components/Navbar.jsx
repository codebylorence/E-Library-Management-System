import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import cvsulogo from "../assets/CvSU-Logo.webp";

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home",     to: "/"         },
    { name: "Catalogs", to: "/catalogs" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#3F9242] border-b border-white/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">

          {/* Logo Section */}
          {/* Added flex-1 and min-w-0 to allow text truncation on tiny screens */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-4">
            {/* Added shrink-0 and responsive sizing to the image */}
            <img 
              src={cvsulogo} 
              alt="CVSU Logo" 
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain shrink-0" 
            />
            {/* min-w-0 ensures the text can truncate rather than expanding the container */}
            <div className="leading-tight min-w-0">
              {/* Responsive text sizing and truncate added */}
              <h1 className="text-white text-sm sm:text-base md:text-xl font-bold truncate">
                Cavite State University - Carmona
              </h1>
              {/* Responsive text sizing and truncate added */}
              <p className="text-white/90 text-xs sm:text-sm truncate">
                E-Library Management System
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 shrink-0">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                className="text-white font-medium transition hover:text-green-200"
              >
                {link.name}
              </Link>
            ))}
            <button
              onClick={() => navigate("/login")}
              className="bg-[#227325] text-white px-5 py-2 rounded-full font-medium shadow-md transition-all hover:bg-white hover:text-[#227325] hover:shadow-lg active:scale-95"
            >
              Login
            </button>
          </div>

          {/* Mobile Menu Button */}
          {/* Added shrink-0 so the button never gets squished by the long title */}
          <div className="md:hidden flex items-center shrink-0">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-white focus:outline-none p-1"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {/* Added absolute positioning and animation classes for a smoother dropdown */}
      <div 
        className={`md:hidden absolute w-full bg-white shadow-lg border-t border-gray-200 transition-all duration-300 ease-in-out origin-top ${
          isOpen ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0 pointer-events-none"
        }`}
      >
        <div className="px-4 pt-3 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className="block w-full text-left px-3 py-2 rounded-md text-gray-700 font-medium hover:bg-green-50 hover:text-[#227325] transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2">
            <button
              onClick={() => { setIsOpen(false); navigate("/login"); }}
              className="w-full bg-[#227325] text-white px-5 py-3 rounded-lg font-medium hover:bg-[#1b5e20] transition-colors shadow-sm"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;