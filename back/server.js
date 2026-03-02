import app from "./src/app.js";
import sequelize from "./src/config/database.js";
import User from "./src/models/User.js";

const PORT = process.env.PORT;

sequelize.sync()
  .then(() => {
    console.log("Database & tables created ✅");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error syncing database ❌", err);
  });