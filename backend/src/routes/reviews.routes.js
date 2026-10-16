// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Reviews Routes

import { Router } from 'express';
import { getItemReviews, createReview, listAllReviews } from '../controllers/reviews.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

// GET /api/reviews/item/:itemId → reviews for an item (public)
router.get('/item/:itemId', getItemReviews);

// POST /api/reviews → create review (STUDENT)
router.post('/', authMiddleware, requireRole('STUDENT'), createReview);

// GET /api/reviews → all reviews (ADMIN)
router.get('/', authMiddleware, requireRole('ADMIN'), listAllReviews);

export default router;
