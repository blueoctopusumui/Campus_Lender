// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Loans Controller

import prisma from '../prismaClient.js';

const DEFAULT_LIMIT = 20;

// ── List loans ────────────────────────────────────────────────────────────────
export const listLoans = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || DEFAULT_LIMIT);
    const skip = (page - 1) * limit;

    // Filter by loan type (lent vs borrowed) or user role
    const where = {};
    if (req.query.type === 'lent') {
      where.request = { item: { ownerId: req.user.userId } };
    } else if (req.query.type === 'borrowed') {
      where.request = { borrowerId: req.user.userId };
    } else if (req.user.role === 'STUDENT') {
      where.OR = [
        { request: { borrowerId: req.user.userId } },
        { request: { item: { ownerId: req.user.userId } } },
      ];
    }

    if (req.query.status === 'ACTIVE') {
      where.returnedAt = null;
    } else if (req.query.status === 'RETURNED') {
      where.returnedAt = { not: null };
    } else if (req.query.status === 'OVERDUE') {
      where.returnedAt = null;
      where.dueDate = { lt: new Date() };
    }

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        skip,
        take: limit,
        include: {
          request: {
            include: {
              item: { include: { category: true } },
              borrower: { select: { userId: true, fullName: true, email: true, regNo: true } },
            },
          },
          fine: true,
          reviews: true,
          approver: { select: { userId: true, fullName: true } },
        },
        orderBy: { issuedAt: 'desc' },
      }),
      prisma.loan.count({ where }),
    ]);

    return res.json({
      success: true,
      data: loans,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── Get loan by ID ────────────────────────────────────────────────────────────
export const getLoanById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const loan = await prisma.loan.findUnique({
      where: { loanId: id },
      include: {
        request: {
          include: {
            item: { include: { category: true } },
            borrower: { select: { userId: true, fullName: true, email: true, regNo: true } },
          },
        },
        fine: true,
        reviews: true,
        approver: { select: { userId: true, fullName: true } },
      },
    });

    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found.' });

    // Student can only see own loan (borrowed or lent)
    if (req.user.role === 'STUDENT' && loan.request.borrowerId !== req.user.userId && loan.request.item?.ownerId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.json({ success: true, data: loan });
  } catch (err) {
    next(err);
  }
};

// ── Return item via stored procedure (STAFF/ADMIN or Item Owner) ─────────────
export const returnLoan = async (req, res, next) => {
  try {
    const loanId = parseInt(req.params.id);
    const { condition } = req.body;

    if (!condition) {
      return res.status(400).json({ success: false, message: 'Return condition is required.' });
    }

    const upperCondition = String(condition).trim().toUpperCase();
    const validConditions = ['NEW', 'GOOD', 'FAIR', 'POOR'];
    if (!validConditions.includes(upperCondition)) {
      return res.status(400).json({
        success: false,
        message: 'Return condition must be one of: NEW, GOOD, FAIR, POOR.',
      });
    }

    const loan = await prisma.loan.findUnique({
      where: { loanId },
      include: {
        request: {
          include: {
            item: true,
            borrower: { select: { userId: true, fullName: true, email: true, regNo: true } },
          },
        },
      },
    });
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found.' });
    if (loan.returnedAt) {
      return res.status(400).json({ success: false, message: 'Item has already been returned.' });
    }

    // Permission check: Item owner, Staff, or Admin
    const isOwner = loan.request?.item?.ownerId === req.user.userId;
    const isStaffOrAdmin = req.user.role === 'ADMIN' || req.user.role === 'STAFF';
    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the item lender (owner) or campus staff can confirm return of this item.',
      });
    }

    // Call stored procedure
    await prisma.$executeRaw`CALL sp_return_loan(${loanId}, ${upperCondition})`;

    // Keep item physical condition in items table updated
    if (loan.request?.itemId) {
      await prisma.item.update({
        where: { itemId: loan.request.itemId },
        data: { itemCondition: upperCondition },
      }).catch(() => {});
    }

    // Fetch updated loan
    const updated = await prisma.loan.findUnique({
      where: { loanId },
      include: {
        request: { include: { item: true, borrower: true } },
        fine: true,
      },
    });

    const itemTitle = loan.request?.item?.title || 'the item';
    const isLate = updated?.fine && Number(updated.fine.amount) > 0;
    const fineAmount = isLate ? Number(updated.fine.amount).toFixed(2) : '0.00';

    // Calculate days overdue if late
    let daysLate = 1;
    if (isLate && updated.dueDate && updated.returnedAt) {
      const diffMs = new Date(updated.returnedAt).getTime() - new Date(updated.dueDate).getTime();
      daysLate = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Dynamic notification to borrower: normal on-time vs returned after due date with fine
    try {
      let borrowerMessage;
      let notifType = 'GENERAL';
      if (isLate) {
        notifType = 'OVERDUE';
        borrowerMessage = `You have returned "${itemTitle}" after the due date (${daysLate} day${daysLate > 1 ? 's' : ''} late). A late fine of ₹${fineAmount} has been applied. Please settle your fine under Fine Settlement.`;
      } else {
        borrowerMessage = `You have returned "${itemTitle}" on time. Thank you! You can now rate and review your borrowing experience.`;
      }

      await prisma.notification.create({
        data: {
          userId: loan.request.borrowerId,
          notificationType: notifType,
          message: borrowerMessage,
        },
      });

      // If staff/admin or peer processed return, notify the lender too
      if (loan.request.item.ownerId !== req.user.userId) {
        await prisma.notification.create({
          data: {
            userId: loan.request.item.ownerId,
            notificationType: 'GENERAL',
            message: `Your item "${itemTitle}" was returned by ${updated.request?.borrower?.fullName || loan.request?.borrower?.fullName || 'the borrower'} (Condition: ${upperCondition}).`,
          },
        });
      }
    } catch (e) {
      console.error('[Notification] returnLoan error:', e.message);
    }

    return res.json({
      success: true,
      message: isLate
        ? `Item returned after due date. Late fine of ₹${fineAmount} applied.`
        : 'Item returned successfully on time.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// ── Get all overdue loans (ADMIN/STAFF) ───────────────────────────────────────
export const getOverdueLoans = async (req, res, next) => {
  try {
    const now = new Date();
    const loans = await prisma.loan.findMany({
      where: {
        returnedAt: null,
        dueDate: { lt: now },
      },
      include: {
        request: {
          include: {
            item: { include: { category: true } },
            borrower: { select: { userId: true, fullName: true, email: true, regNo: true } },
          },
        },
        fine: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    return res.json({
      success: true,
      data: loans,
      count: loans.length,
    });
  } catch (err) {
    next(err);
  }
};
