// Protects routes: only requests with a valid login token are allowed through.

const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  // The token arrives in the header:  Authorization: Bearer <token>
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Please log in first." });
  }

  try {
    // Check that the token is real and has not expired
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, name: payload.name, email: payload.email };
    next(); // allowed, continue to the route
  } catch (error) {
    console.error("Authentication error:", error.message);
    return res.status(401).json({
      message: "Your session is invalid or has expired. Please log in again.",
    });
  }
}

module.exports = requireAuth;
