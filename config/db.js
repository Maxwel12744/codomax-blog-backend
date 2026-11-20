// Connects the server to MongoDB.

const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("Missing MONGODB_URI. Add it to your .env file and restart.");
    process.exit(1);
  }

  try {
    // Give up after 10 seconds instead of waiting forever
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log("Connected to MongoDB");
  } catch (error) {
    // The connection string holds a password, so it is never printed
    console.error("Could not connect to MongoDB:", error.message);

    const message = error.message.toLowerCase();
    if (
      message.includes("bad auth") ||
      message.includes("authentication failed")
    ) {
      console.error("Hint: check the username and password in MONGODB_URI.");
    } else if (message.includes("enotfound") || message.includes("querysrv")) {
      console.error(
        "Hint: check your internet connection and the address in MONGODB_URI.",
      );
    } else {
      console.error(
        "Hint: in Atlas, open Network Access and add your current IP address.",
      );
    }
    process.exit(1);
  }
}

module.exports = connectDB;
