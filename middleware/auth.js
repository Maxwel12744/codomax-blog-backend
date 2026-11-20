// User registration and login routes

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

// A simple check that an email looks like name@site.com
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Create a login token that lasts 7 days
function createToken(user) {
  return jwt.sign(
    { id: user._id.toString(), name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

// POST /api/auth/register  -> create a new account
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body || {};

    // 1. Check the details sent by the user.
    // typeof must be "string": this blocks tricks like { "email": { "$gt": "" } }
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required." });
    }
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res
        .status(400)
        .json({ message: "Name, email and password must be text." });
    }
    if (!isValidEmail(email.trim())) {
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
    const cleanEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: cleanEmail })) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }

    // 3. Hash the password. We never store the real password.
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Save the new user in the database
    let user;
    try {
      user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
      });
    } catch (error) {
      // Code 11000 means the unique email rule stopped a duplicate
      // (for example, two sign-ups with the same email at the same moment)
      if (error.code === 11000) {
        return res
          .status(409)
          .json({ message: "An account with this email already exists." });
      }
      throw error;
    }

    // 5. Send back the user (without the password) and a login token
    res.status(201).json({
      message: "Account created successfully.",
      token: createToken(user),
      user: { id: user._id.toString(), name: user.name, email: user.email },
    });
  }),
);

// POST /api/auth/login  -> log in to an existing account
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }
    if (typeof email !== "string" || typeof password !== "string") {
      return res
        .status(400)
        .json({ message: "Email and password must be text." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

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
      user: { id: user._id.toString(), name: user.name, email: user.email },
    });
  }),
);

// GET /api/auth/me  -> who am I? (needs a valid token)
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    // Check the account still exists, because a token outlives a deleted user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(401)
        .json({ message: "This account no longer exists." });
    }
    res.json({
      user: { id: user._id.toString(), name: user.name, email: user.email },
    });
  }),
);

module.exports = router;
