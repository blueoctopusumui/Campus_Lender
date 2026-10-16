// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Admin Routes

import { Router } from 'express';
import {
  getDashboardStats,
  getTopBorrowedItems,
  getDeptFines,
  getUsageReport,
  getAuditLogs,
  runRemindersManually,
} from '../controllers/admin.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

// All admin routes: must be authenticated + ADMIN role
router.use(authMiddleware);
router.use(requireRole('ADMIN'));

// GET /api/admin/dashboard → summary stats
router.get('/dashboard', getDashboardStats);

// GET /api/admin/reports/top-items → top 5 most borrowed
router.get('/reports/top-items', getTopBorrowedItems);

// GET /api/admin/reports/dept-fines → unpaid fines per department
router.get('/reports/dept-fines', getDeptFines);

// GET /api/admin/reports/usage → dept-wise item usage
router.get('/reports/usage', getUsageReport);

// GET /api/admin/audit-logs → paginated audit logs
router.get('/audit-logs', getAuditLogs);

// POST /api/admin/run-reminders → manually trigger reminder job
router.post('/run-reminders', runRemindersManually);

export default router;
