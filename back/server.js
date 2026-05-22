import app from "./src/app.js";
import sequelize from "./src/config/database.js";
import User from "./src/models/User.js";
import Book from "./src/models/Book.js";
import BorrowRecord from "./src/models/BorrowRecord.js";
import AttendanceRecord from "./src/models/AttendanceRecord.js";
import seedAdmin from "./src/config/seedAdmin.js";

const PORT = process.env.PORT;
const shouldAlter = process.env.DB_SYNC_ALTER === "true";

sequelize.sync({ alter: shouldAlter })
  .then(async () => {
    console.log(`Database synced ✅ ${shouldAlter ? "(alter mode)" : ""}`);

    // Ensure role ENUM includes faculty and staff
    try {
      await sequelize.query(
        "ALTER TABLE `Users` MODIFY COLUMN `role` ENUM('admin','librarian','student','faculty','staff') NOT NULL DEFAULT 'student';"
      );
    } catch {
      // Already correct, ignore
    }

    // Ensure materialType ENUM has all resource type values
    try {
      await sequelize.query(
        "ALTER TABLE `Books` MODIFY COLUMN `materialType` ENUM('Library Books', 'E-Books', 'E-Journals', 'Thesis / Dissertation', 'Magazine / Article') NOT NULL DEFAULT 'Library Books';"
      );
    } catch {
      // Column already correct, ignore
    }

    // Ensure AttendanceRecords.timeIn is VARCHAR (was TIME, changed to store 12-hour format)
    try {
      await sequelize.query(
        "ALTER TABLE `AttendanceRecords` MODIFY COLUMN `timeIn` VARCHAR(20) NOT NULL;"
      );
    } catch {
      // Column already correct or table doesn't exist yet, ignore
    }

    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error syncing database ❌", err);
  });

  