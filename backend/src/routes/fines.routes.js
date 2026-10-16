// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Fines Routes

import { Router } from 'express';
import { listFines, getFineById, markFinePaid } from '../controllers/fines.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

router.use(authMiddleware);

// GET /api/fines → list fines (ADMIN: all; STUDENT: own)
router.get('/', listFines);

// GET /api/fines/:id → fine detail
router.get('/:id', getFineById);

// PUT /api/fines/:id/pay → mark as paid (ADMIN/STAFF)
router.put('/:id/pay', requireRole('ADMIN', 'STAFF'), markFinePaid);

export default router;
