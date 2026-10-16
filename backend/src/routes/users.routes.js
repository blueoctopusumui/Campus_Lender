// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Users Routes

import { Router } from 'express';
import {
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserLoans,
  getUserRequests,
} from '../controllers/users.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// GET /api/users → list all users (ADMIN only, paginated)
router.get('/', requireRole('ADMIN'), listUsers);

// GET /api/users/:id → get user by id (ADMIN or self)
router.get('/:id', getUserById);

// PUT /api/users/:id → update user (ADMIN or self)
router.put('/:id', updateUser);

// DELETE /api/users/:id → soft delete (ADMIN only)
router.delete('/:id', requireRole('ADMIN'), deleteUser);

// GET /api/users/:id/loans → user's loans
router.get('/:id/loans', getUserLoans);

// GET /api/users/:id/requests → user's requests
router.get('/:id/requests', getUserRequests);

export default router;
