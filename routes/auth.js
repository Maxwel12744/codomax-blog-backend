// User registration and login routes

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { readData, writeData } = require("../utils/db");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// A simple check that an email looks like name@site.com
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Create a login token that lasts 7 days
function createToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

// POST /api/auth/register  -> create a new account
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};

  // 1. Check the details sent by the user
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email and password are required." });
  }
  if (!isValidEmail(email)) {
    return res
      .status(400)
      .json({ message: "Please enter a valid email address." });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters." });
  }

  // 2. Make sure the email is not already used
  const users = readData("users");
  const cleanEmail = email.trim().toLowerCase();
  if (users.find((u) => u.email === cleanEmail)) {
    return res
      .status(409)
      .json({ message: "An account with this email already exists." });
  }

  // 3. Hash the password. We never store the real password.
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Save the new user
  const newUser = {
    id: Date.now(),
    name: name.trim(),
    email: cleanEmail,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeData("users", users);

  // 5. Send back the user (without the password) and a login token
  res.status(201).json({
    message: "Account created successfully.",
    token: createToken(newUser),
    user: { id: newUser.id, name: newUser.name, email: newUser.email },
  });
});

// POST /api/auth/login  -> log in to an existing account
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  const users = readData("users");
  const user = users.find((u) => u.email === email.trim().toLowerCase());

  // The same message is used for a wrong email or a wrong password,
  // so nobody can use it to find out which emails are registered.
  if (!user) {
    return res.status(401).json({ message: "Incorrect email or password." });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Incorrect email or password." });
  }

  res.json({
    message: "Login successful.",
    token: createToken(user),
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// GET /api/auth/me  -> who am I? (needs a valid token)
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
