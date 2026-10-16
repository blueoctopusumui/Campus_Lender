// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Lending Requests Routes

import { Router } from 'express';
import {
  listRequests,
  getRequestById,
  createRequest,
  approveRequest,
  rejectRequest,
  cancelRequest,
} from '../controllers/requests.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

router.use(authMiddleware);

// GET /api/requests → list (ADMIN/STAFF: all; STUDENT: own)
router.get('/', listRequests);

// GET /api/requests/:id → request detail
router.get('/:id', getRequestById);

// POST /api/requests → create (STUDENT)
router.post('/', requireRole('STUDENT'), createRequest);

// PUT /api/requests/:id/approve → approve (Item Owner, STAFF, ADMIN)
router.put('/:id/approve', approveRequest);

// PUT /api/requests/:id/reject → reject (Item Owner, STAFF, ADMIN)
router.put('/:id/reject', rejectRequest);

// PUT /api/requests/:id/cancel → cancel own request (STUDENT)
router.put('/:id/cancel', requireRole('STUDENT'), cancelRequest);

export default router;
