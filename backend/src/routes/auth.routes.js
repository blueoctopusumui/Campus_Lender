// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Auth Routes

import { Router } from 'express';
import { body } from 'express-validator';
import {
  googleRedirect_24BCE2516,
  googleCallback_24BCE2516,
  googleSSO_24BCE2516,
  googleStatus_24BCE2516,
  localLogin_24BCE2516,
  logout_24BCE2516,
  getMe_24BCE2516,
  register_24BCE2516,
  getEnrollmentMeta_24BCE2516,
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// GET /api/auth/meta → metadata for registration (departments & roles)
router.get('/meta', getEnrollmentMeta_24BCE2516);
router.get('/departments', getEnrollmentMeta_24BCE2516);

// Google OAuth endpoints
router.get('/google/status', googleStatus_24BCE2516);
router.post('/google/sso', googleSSO_24BCE2516);
router.get('/google', googleRedirect_24BCE2516);
router.get('/google/callback', googleCallback_24BCE2516);

// POST /api/auth/register → enroll/create new student or staff account
router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required.'),
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  validate,
  register_24BCE2516
);

// POST /api/auth/enroll → alias for register
router.post(
  '/enroll',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required.'),
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  validate,
  register_24BCE2516
);

// POST /api/auth/login → local admin/staff/student login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  localLogin_24BCE2516
);

// POST /api/auth/logout → clear cookie
router.post('/logout', logout_24BCE2516);

// GET /api/auth/me → current user (protected)
router.get('/me', authMiddleware, getMe_24BCE2516);

export default router;
