/**
 * Normalise a coverImage value from the DB into a usable src URL.
 *
 * Cases handled:
 *  - null / empty          → return null (show placeholder)
 *  - relative  /uploads/…  → proxy via Vite dev server (no change needed, works with proxy)
 *  - absolute  http://localhost:6000/uploads/… → strip origin, keep path so Vite proxy works
 *  - any other http/https  → return as-is (external URL)
 */
export const coverUrl = (raw) => {
  if (!raw) return null;

  // Strip hardcoded localhost origin so Vite proxy can handle it
  if (raw.startsWith("http://localhost:5000")) {
    return raw.replace("http://localhost:5000", "");
  }

  return raw;
};
