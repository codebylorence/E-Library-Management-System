import { useState } from "react";
import { BookMarked, X } from "lucide-react";
import { coverUrl } from "../utils/coverUrl";

const CoverImage = ({ book, className = "" }) => {
  const [lightbox, setLightbox] = useState(false);
  const src = coverUrl(book.coverImage);

  return (
    <>
      {/* Card thumbnail */}
      <div
        className={`bg-gray-100 flex items-center justify-center overflow-hidden ${className} ${src ? "cursor-zoom-in" : ""}`}
        onClick={() => src && setLightbox(true)}
      >
        {src ? (
          <img
            src={src}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <BookMarked size={40} className="text-gray-300" />
        )}
      </div>

      {/* Lightbox overlay */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(false)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/70 rounded-full p-1.5 transition-colors"
            onClick={() => setLightbox(false)}
          >
            <X size={20} />
          </button>

          {/* Full image — click on image itself won't close */}
          <img
            src={src}
            alt={book.title}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Caption */}
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-sm drop-shadow">{book.title}</p>
            <p className="text-xs text-white/70">{book.author}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default CoverImage;
