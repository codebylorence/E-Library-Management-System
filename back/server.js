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

    // Add quick borrow inline fields to BorrowRecords if missing
    try {
      await sequelize.query("ALTER TABLE `BorrowRecords` MODIFY COLUMN `bookId` INT NULL;");
    } catch { /* already nullable */ }
    for (const col of [
      "ADD COLUMN `qbTitle` VARCHAR(255) NULL",
      "ADD COLUMN `qbAuthor` VARCHAR(255) NULL",
      "ADD COLUMN `qbIsbn` VARCHAR(255) NULL",
      "ADD COLUMN `qbCategory` VARCHAR(255) NULL",
      "ADD COLUMN `qbPublisher` VARCHAR(255) NULL",
      "ADD COLUMN `qbShelfLocation` VARCHAR(255) NULL",
      "ADD COLUMN `qbPublishedYear` INT NULL",
    ]) {
      try { await sequelize.query(`ALTER TABLE \`BorrowRecords\` ${col};`); } catch { /* already exists */ }
    }

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

  