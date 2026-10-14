import Notification from "../models/Notification.js";

const fail = (res, error) => {
  if (error.name === "CastError") return res.status(404).json({ message: "Notification not found" });
  res.status(500).json({ message: error.message });
};

export const getNotifications = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const filter = { user: req.user._id };
    if (req.query.filter === "unread") filter.isRead = false;

    const [total, notifications, unread] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments({ user: req.user._id, isRead: false }),
    ]);

    res.json({ notifications, total, unread, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    fail(res, error);
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const unread = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ unread });
  } catch (error) {
    fail(res, error);
  }
};

export const markRead = async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: "Notification not found" });
    res.json({ notification: n });
  } catch (error) {
    fail(res, error);
  }
};

export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    fail(res, error);
  }
};

export const removeNotification = async (req, res) => {
  try {
    const n = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!n) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Deleted" });
  } catch (error) {
    fail(res, error);
  }
};