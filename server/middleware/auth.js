import jwt from "jsonwebtoken";
import User from "../models/User.js";

// While a temporary password is active, only these routes are allowed
const ALLOWED_WHEN_LOCKED = ["/api/auth/me", "/api/auth/password", "/api/auth/logout"];

export const protect = async (req, res, next) => {
  try {
    let token = req.cookies.token;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return res.status(401).json({ message: "Not logged in" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or deactivated" });
    }

    if (user.mustChangePassword && !ALLOWED_WHEN_LOCKED.includes(req.originalUrl.split("?")[0])) {
      return res.status(403).json({
        message: "Please change your temporary password first",
        code: "PASSWORD_CHANGE_REQUIRED",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission for this action" });
  }
  next();
};