// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Reviews Controller

import prisma from '../prismaClient.js';

// ── Get reviews for an item ───────────────────────────────────────────────────
export const getItemReviews = async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.itemId);

    const reviews = await prisma.review.findMany({
      where: { loan: { request: { itemId } } },
      select: {
        reviewId: true,
        loanId: true,
        rating: true,
        comment: true,
        createdAt: true,
        reviewer: { select: { userId: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};

// ── Create review (STUDENT, only for returned loans they borrowed) ─────────────
export const createReview = async (req, res, next) => {
  try {
    const { loanId, rating, comment } = req.body;

    if (!loanId || !rating) {
      return res.status(400).json({ success: false, message: 'loanId and rating are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    // Verify the loan exists, belongs to the student, and item was returned
    const loan = await prisma.loan.findUnique({
      where: { loanId: parseInt(loanId) },
      include: { request: true },
    });

    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found.' });

    if (loan.request.borrowerId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You can only review your own loans.' });
    }

    if (!loan.returnedAt) {
      return res.status(400).json({ success: false, message: 'Item must be returned before leaving a review.' });
    }

    // Check for duplicate review
    const existing = await prisma.review.findFirst({
      where: { loanId: parseInt(loanId), reviewerId: req.user.userId },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this loan.' });
    }

    const review = await prisma.review.create({
      data: {
        loanId: parseInt(loanId),
        reviewerId: req.user.userId,
        rating: parseInt(rating),
        comment,
      },
      include: {
        reviewer: { select: { userId: true, fullName: true } },
      },
    });

    return res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

// ── All reviews (ADMIN) ───────────────────────────────────────────────────────
export const listAllReviews = async (_req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        reviewer: { select: { userId: true, fullName: true, email: true } },
        loan: { include: { request: { include: { item: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};
