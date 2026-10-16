// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Global Error Handler Middleware

import { Prisma } from '@prisma/client';

/**
 * Global error handler middleware.
 * Handles Prisma errors, validation errors, and general errors.
 * Returns consistent JSON: { success: false, message, errors? }
 */
export const errorHandler = (err, req, res, next) => {
  // Log in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ErrorHandler] ${req.method} ${req.originalUrl}`, err);
  }

  // ── Prisma Known Request Errors ──────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const fields = err.meta?.target ?? 'field';
        return res.status(409).json({
          success: false,
          message: `Duplicate value: a record with this ${fields} already exists.`,
        });
      }
      case 'P2025':
        return res.status(404).json({
          success: false,
          message: 'Record not found.',
        });
      case 'P2003':
        return res.status(400).json({
          success: false,
          message: 'Foreign key constraint failed. Referenced record does not exist.',
        });
      case 'P2014':
        return res.status(400).json({
          success: false,
          message: 'The change violates a required relation.',
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Database error [${err.code}]: ${err.message}`,
        });
    }
  }

  // ── Prisma Validation Error ──────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid data provided to the database.',
    });
  }

  // ── Custom status code errors ────────────────────────────────────────
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error.';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors ? { errors: err.errors } : {}),
  });
};
