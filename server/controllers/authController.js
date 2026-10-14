import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import jwt from "jsonwebtoken";

const formatUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  avatar: u.avatar,
  role: u.role,
  department: u.department,
  createdAt: u.createdAt,
    mustChangePassword: u.mustChangePassword,
});

export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
        if (email.trim().toLowerCase().endsWith("@jansamadhan.in")) {
      return res.status(403).json({ message: "This email domain is reserved for government staff" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    // Public signup is always a citizen. Staff accounts are created by admins later.
    const user = await User.create({ name, email, password, phone, role: "citizen" });

    const token = generateToken(res, user._id);
    res.status(201).json({ user: formatUser(user), token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, portal } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated" });
    }

    const isStaff = ["officer", "admin", "superadmin"].includes(user.role);
    if (portal === "staff" && !isStaff) {
      return res.status(403).json({ message: "This is not a staff account. Please use Citizen login." });
    }
    if (portal === "citizen" && isStaff) {
      return res.status(403).json({ message: "This is a staff account. Please use Staff login." });
    }

    const token = generateToken(res, user._id);
    res.json({ user: formatUser(user), token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = (req, res) => {
  res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
  res.json({ message: "Logged out successfully" });
};

export const getMe = (req, res) => {
  res.json({ user: formatUser(req.user) });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ message: "Name cannot be empty" });
      user.name = name.trim();
    }
    if (phone !== undefined) user.phone = phone.trim();

    await user.save();
    res.json({ user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both passwords are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from the current one" });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();
    res.json({ message: "Password changed successfully", user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getSocketToken = (req, res) => {
  const token = jwt.sign({ id: req.user._id }, `${process.env.JWT_SECRET}:socket`, { expiresIn: "2m" });
  res.json({ token });
};