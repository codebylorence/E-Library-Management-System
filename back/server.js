import app from "./src/app.js";
import sequelize from "./src/config/database.js";
import User from "./src/models/User.js";
import Book from "./src/models/Book.js";
import seedAdmin from "./src/config/seedAdmin.js";

const PORT = process.env.PORT;

sequelize.sync({ alter: true })
  .then(async () => {
    console.log("Database & tables created ✅");

    // Ensure materialType ENUM has correct values
    try {
      await sequelize.query(
        "ALTER TABLE `Books` MODIFY COLUMN `materialType` ENUM('Library Books', 'E-Books', 'E-Journals') NOT NULL DEFAULT 'Library Books';"
      );
      console.log("materialType ENUM updated ✅");
    } catch (err) {
      console.log("materialType column note:", err.message);
    }

    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error syncing database ❌", err);
  });

  