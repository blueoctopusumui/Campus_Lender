// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Notifications Controller

import prisma from '../prismaClient.js';

// ── Get user's notifications ──────────────────────────────────────────────────
export const getNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId: req.user.userId } }),
    ]);

    return res.json({
      success: true,
      data: notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── Mark notification as read ─────────────────────────────────────────────────
export const markAsRead = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const notification = await prisma.notification.findUnique({ where: { notificationId: id } });

    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });

    if (notification.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const updated = await prisma.notification.update({
      where: { notificationId: id },
      data: { isRead: true },
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ── Mark all notifications as read ────────────────────────────────────────────
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true },
    });

    return res.json({ success: true, message: `Marked ${result.count} notifications as read.` });
  } catch (err) {
    next(err);
  }
};

// ── Unread count (for bell badge) ─────────────────────────────────────────────
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.userId, isRead: false },
    });

    return res.json({ success: true, data: { unreadCount: count } });
  } catch (err) {
    next(err);
  }
};
