// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Notifications Routes

import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '../controllers/notifications.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/notifications/unread-count → count unread (must be before /:id)
router.get('/unread-count', getUnreadCount);

// GET /api/notifications → user's notifications
router.get('/', getNotifications);

// PUT /api/notifications/read-all → mark all as read (must be before /:id)
router.put('/read-all', markAllAsRead);

// PUT /api/notifications/:id/read → mark one as read
router.put('/:id/read', markAsRead);

export default router;
