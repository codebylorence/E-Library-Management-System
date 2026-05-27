import LibrarySettings from "../models/LibrarySettings.js";

const DEFAULTS = {
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
};

/* ── GET settings (public) ── */
export const getSettings = async (req, res) => {
  try {
    let settings = await LibrarySettings.findByPk(1);
    if (!settings) {
      settings = await LibrarySettings.create({ id: 1, ...DEFAULTS });
    }
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch settings.", error: err.message });
  }
};

/* ── UPDATE settings (admin/librarian) ── */
export const updateSettings = async (req, res) => {
  try {
    const allowed = [
      "hoursMonFri","hoursSaturday","hoursSunday",
      "address","phone","email","website","facebook",
      "announcement1Title","announcement1Body",
      "announcement2Title","announcement2Body",
      "announcement3Title","announcement3Body",
    ];

    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    // Use findOrCreate + update instead of upsert (MySQL upsert doesn't reliably return rows)
    let settings = await LibrarySettings.findByPk(1);
    if (!settings) {
      settings = await LibrarySettings.create({ id: 1, ...DEFAULTS, ...updates });
    } else {
      await settings.update(updates);
      await settings.reload();
    }

    res.json({ message: "Settings updated successfully.", settings });
  } catch (err) {
    res.status(500).json({ message: "Failed to update settings.", error: err.message });
  }
};
