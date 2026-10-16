// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Fines Controller

import prisma from '../prismaClient.js';

const DEFAULT_LIMIT = 20;

// ── List fines ────────────────────────────────────────────────────────────────
export const listFines = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || DEFAULT_LIMIT);
    const skip = (page - 1) * limit;

    // ADMIN sees all, STUDENT sees own
    const where = req.user.role === 'STUDENT'
      ? { loan: { request: { borrowerId: req.user.userId } } }
      : {};

    // Filter by paid / unpaid status
    if (req.query.isPaid !== undefined) {
      where.isPaid = req.query.isPaid === 'true';
    } else if (req.query.status === 'PAID') {
      where.isPaid = true;
    } else if (req.query.status === 'UNPAID') {
      where.isPaid = false;
    }

    const [fines, total] = await Promise.all([
      prisma.fine.findMany({
        where,
        skip,
        take: limit,
        include: {
          loan: {
            include: {
              request: {
                include: {
                  item: true,
                  borrower: { select: { userId: true, fullName: true, email: true, regNo: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fine.count({ where }),
    ]);

    return res.json({
      success: true,
      data: fines,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── Get fine by ID ────────────────────────────────────────────────────────────
export const getFineById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const fine = await prisma.fine.findUnique({
      where: { fineId: id },
      include: {
        loan: {
          include: {
            request: {
              include: {
                item: true,
                borrower: { select: { userId: true, fullName: true, email: true, regNo: true } },
              },
            },
          },
        },
      },
    });

    if (!fine) return res.status(404).json({ success: false, message: 'Fine not found.' });

    // Student can only see own fine
    if (req.user.role === 'STUDENT' && fine.loan.request.borrowerId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.json({ success: true, data: fine });
  } catch (err) {
    next(err);
  }
};

// ── Mark fine as paid (ADMIN/STAFF) ──────────────────────────────────────────
export const markFinePaid = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const fine = await prisma.fine.findUnique({
      where: { fineId: id },
      include: {
        loan: {
          include: {
            request: {
              include: {
                item: true,
                borrower: { select: { userId: true, fullName: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!fine) return res.status(404).json({ success: false, message: 'Fine not found.' });
    if (fine.isPaid) {
      return res.status(400).json({ success: false, message: 'Fine is already marked as paid.' });
    }

    const updated = await prisma.fine.update({
      where: { fineId: id },
      data: { isPaid: true, paidOn: new Date() },
    });

    // Notify borrower of fine settlement
    try {
      const borrowerId = fine.loan?.request?.borrowerId;
      const itemTitle = fine.loan?.request?.item?.title || 'the item';
      const amountStr = Number(fine.amount).toFixed(2);
      if (borrowerId) {
        await prisma.notification.create({
          data: {
            userId: borrowerId,
            notificationType: 'GENERAL',
            message: `Your overdue fine of ₹${amountStr} for "${itemTitle}" (Loan #${fine.loanId}) has been marked as settled.`,
          },
        });
      }
    } catch (e) {
      console.error('[Notification] markFinePaid error:', e.message);
    }

    return res.json({ success: true, message: 'Fine marked as paid.', data: updated });
  } catch (err) {
    next(err);
  }
};
