const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware: runs on every request before the routes
app.use(cors()); // allow the React app to call this server
app.use(express.json()); // let the server read JSON sent in requests

// A simple test route
app.get("/", (req, res) => {
  res.json({ message: "GlobalSpace API is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
