// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Loans Routes

import { Router } from 'express';
import {
  listLoans,
  getLoanById,
  returnLoan,
  getOverdueLoans,
} from '../controllers/loans.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

router.use(authMiddleware);

// GET /api/loans/overdue → all overdue loans (ADMIN/STAFF)
// NOTE: must be before /:id to avoid route conflict
router.get('/overdue', requireRole('ADMIN', 'STAFF'), getOverdueLoans);

// GET /api/loans → list loans
router.get('/', listLoans);

// GET /api/loans/:id → loan details
router.get('/:id', getLoanById);

// POST /api/loans/:id/return → return item (Item Owner, STAFF, ADMIN)
router.post('/:id/return', returnLoan);

export default router;
