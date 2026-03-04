/**
 * SignLex Backend - Authentication Middleware
 * Author: Amin Memon
 *
 * Verifies Firebase ID tokens from the Authorization header.
 * Attaches decoded user info to req.user for downstream handlers.
 *
 * Status: ~15% - Token verification implemented,
 *   optional auth and role-based access TODO for full implementation.
 */

const { getAuth } = require("../config/firebase");

/**
 * Require valid Firebase token.
 * Expects header: Authorization: Bearer <idToken>
 */
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No authentication token provided" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || null,
      picture: decodedToken.picture || null,
    };
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Optional auth - attaches user if token present, continues regardless.
 * Useful for public endpoints that show extra data for logged-in users.
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || null,
    };
  } catch {
    req.user = null;
  }

  next();
};

module.exports = { requireAuth, optionalAuth };
