// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Main Express Application Entry Point

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import itemRoutes from './routes/items.routes.js';
import categoryRoutes from './routes/categories.routes.js';
import requestRoutes from './routes/requests.routes.js';
import loanRoutes from './routes/loans.routes.js';
import fineRoutes from './routes/fines.routes.js';
import reviewRoutes from './routes/reviews.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { startReminderJob } from './jobs/reminderJob.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'CampusLend API is running', timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 CampusLend API - 24BCE0246 & 24BCE2516 running on port ${PORT}`);
  startReminderJob();
});

export default app;
