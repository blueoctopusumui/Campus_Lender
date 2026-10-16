// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Items Routes

import { Router } from 'express';
import {
  listItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/items.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

// GET /api/items → list items (public)
router.get('/', listItems);

// GET /api/items/:id → item details (public)
router.get('/:id', getItemById);

// POST /api/items → list/register item (Students, Staff, Admin)
router.post('/', authMiddleware, createItem);

// PUT /api/items/:id → update item (owner or ADMIN)
router.put('/:id', authMiddleware, updateItem);

// DELETE /api/items/:id → delete item (owner or ADMIN)
router.delete('/:id', authMiddleware, deleteItem);

export default router;
