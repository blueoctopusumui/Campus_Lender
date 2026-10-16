// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Categories Routes

import { Router } from 'express';
import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categories.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

// GET /api/categories → list all (public)
router.get('/', listCategories);

// GET /api/categories/:id → get one (public)
router.get('/:id', getCategoryById);

// POST /api/categories → create (ADMIN)
router.post('/', authMiddleware, requireRole('ADMIN'), createCategory);

// PUT /api/categories/:id → update (ADMIN)
router.put('/:id', authMiddleware, requireRole('ADMIN'), updateCategory);

// DELETE /api/categories/:id → delete (ADMIN)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), deleteCategory);

export default router;
