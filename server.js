require("dotenv").config(); // loads the secret key from the .env file

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");

// Stop early if the secret key is missing, because logins would not work safely
if (!process.env.JWT_SECRET) {
  console.error(
    "Missing JWT_SECRET. Create a .env file (see README) and restart.",
  );
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware: runs on every request before the routes
app.use(cors()); // allow the React app to call this server
app.use(express.json()); // let the server read JSON sent in requests

// A simple test route
app.get("/", (req, res) => {
  res.json({ message: "GlobalSpace API is running" });
});

// All login and registration routes start with /api/auth
app.use("/api/auth", authRoutes);

// If no route matched, tell the user
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Error handler: always answers with JSON, and never shows internal details
app.use((err, req, res, next) => {
  // The request body was not valid JSON
  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ message: "The request body is not valid JSON." });
  }
  console.error(err); // the full error is only printed in the server terminal
  res.status(500).json({ message: "Something went wrong on the server." });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
