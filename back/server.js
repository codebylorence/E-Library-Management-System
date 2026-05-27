import "./src/config/env.js"; // load .env first before any other imports
import app from "./src/app.js";
import sequelize from "./src/config/database.js";

// Import all models so Sequelize registers them before sync
import "./src/models/User.js";
import "./src/models/Book.js";
import "./src/models/BorrowRecord.js";
import "./src/models/AttendanceRecord.js";
import "./src/models/ReservationRecord.js";
import "./src/models/LibrarySettings.js";

import seedAdmin from "./src/config/seedAdmin.js";

const PORT = process.env.PORT || 5000;
const shouldAlter = process.env.DB_SYNC_ALTER === "true";

sequelize.sync({ alter: shouldAlter })
  .then(async () => {
    console.log(`Database synced ✅ ${shouldAlter ? "(alter mode)" : ""}`);

    // Seed default LibrarySettings row if missing
    try {
      const { default: LibrarySettings } = await import("./src/models/LibrarySettings.js");
      const existing = await LibrarySettings.findByPk(1);
      if (!existing) await LibrarySettings.create({ id: 1 });
    } catch { /* ignore */ }

    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error syncing database ❌", err);
    process.exit(1);
  });
