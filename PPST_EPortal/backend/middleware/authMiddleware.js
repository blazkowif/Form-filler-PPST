// =============================================================
// middleware/authMiddleware.js — JWT Verification & RBAC Guards
// =============================================================
// Provides two key exports:
//   1. `protect`        — Verifies the JWT token on any request
//   2. `authorizeRoles` — Restricts a route to specific roles
// =============================================================

const jwt = require("jsonwebtoken");

/**
 * `protect` Middleware
 * --------------------
 * Reads the JWT from the `Authorization: Bearer <token>` header,
 * verifies it, and attaches the decoded user payload to `req.user`.
 * If invalid or missing, responds with 401 Unauthorized.
 */
const protect = (req, res, next) => {
  try {
    // 1. Extract the token from the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authentication token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify the token signature and expiry using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach the decoded payload to the request object for downstream use
    // decoded contains: { id, matric_staff_id, name, role, email }
    req.user = decoded;

    next(); // Token is valid — proceed to the route handler
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Authentication error.",
    });
  }
};

/**
 * `authorizeRoles` Middleware Factory
 * ------------------------------------
 * Returns a middleware that only allows users whose role matches
 * one of the provided `allowedRoles`.
 *
 * Usage: router.get('/admin-only', protect, authorizeRoles('admin'), handler)
 *        router.get('/multi',      protect, authorizeRoles('admin', 'pengarah'), handler)
 *
 * @param {...string} allowedRoles - The roles permitted to access the route.
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // `req.user` is set by the `protect` middleware above
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Route requires one of: [${allowedRoles.join(
          ", "
        )}]. Your role: "${req.user?.role}".`,
      });
    }
    next(); // Role is authorised — proceed
  };
};

module.exports = { protect, authorizeRoles };
