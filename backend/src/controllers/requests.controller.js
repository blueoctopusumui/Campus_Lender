// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Lending Requests Controller

import prisma from '../prismaClient.js';

const DEFAULT_LIMIT = 20;

// ── List requests ─────────────────────────────────────────────────────────────
export const listRequests = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const { status, type } = req.query;

    const where = {};

    if (req.user.role === 'STUDENT') {
      if (type === 'lending') {
        // Requests from peers to borrow items owned by this student
        where.item = { ownerId: req.user.userId };
      } else if (type === 'borrowing') {
        // Requests made by this student to borrow from others
        where.borrowerId = req.user.userId;
      } else {
        // All requests involving this student (either as borrower or as item owner)
        where.OR = [
          { borrowerId: req.user.userId },
          { item: { ownerId: req.user.userId } },
        ];
      }
    }

    if (status) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.lendingRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          item: {
            include: {
              category: true,
              owner: { select: { userId: true, fullName: true, email: true } },
            },
          },
          borrower: { select: { userId: true, fullName: true, email: true, regNo: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lendingRequest.count({ where }),
    ]);

    return res.json({
      success: true,
      data: requests,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── Get request by ID ─────────────────────────────────────────────────────────
export const getRequestById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const request = await prisma.lendingRequest.findUnique({
      where: { requestId: id },
      include: {
        item: { include: { category: true } },
        borrower: { select: { userId: true, fullName: true, email: true, regNo: true } },
        loan: true,
      },
    });

    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    // STUDENTs can only view own requests
    if (req.user.role === 'STUDENT' && request.borrowerId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};

// ── Create request (STUDENT) ──────────────────────────────────────────────────
export const createRequest = async (req, res, next) => {
  try {
    const { itemId, requestedFrom, requestedTo, remarks } = req.body;

    if (!itemId || !requestedFrom || !requestedTo) {
      return res.status(400).json({ success: false, message: 'itemId, requestedFrom, and requestedTo are required.' });
    }

    // Validate item is AVAILABLE
    const item = await prisma.item.findUnique({ where: { itemId: parseInt(itemId) } });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
    if (item.status !== 'AVAILABLE') {
      return res.status(400).json({ success: false, message: `Item is not available (current status: ${item.status}).` });
    }

    if (item.ownerId === req.user.userId) {
      return res.status(400).json({ success: false, message: 'You cannot request to borrow an item that you already own.' });
    }

    const fromDate = new Date(requestedFrom);
    const toDate = new Date(requestedTo);
    if (toDate <= fromDate) {
      return res.status(400).json({ success: false, message: 'requestedTo must be after requestedFrom.' });
    }

    const request = await prisma.lendingRequest.create({
      data: {
        itemId: parseInt(itemId),
        borrowerId: req.user.userId,
        requestedFrom: fromDate,
        requestedTo: toDate,
        remarks,
        status: 'PENDING',
      },
      include: {
        item: { include: { category: true, owner: true } },
        borrower: { select: { userId: true, fullName: true, email: true } },
      },
    });

    // Notify the lender/owner
    try {
      await prisma.notification.create({
        data: {
          userId: item.ownerId,
          notificationType: 'GENERAL',
          message: `New Borrow Request: ${request.borrower?.fullName || 'A peer'} requested to borrow your item "${item.title}" from ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}. Action required: Please review and approve in Requests & Approvals.`,
        },
      });
    } catch (e) {
      console.error('[Notification] createRequest error:', e.message);
    }

    return res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};

// ── Approve request (Item Owner, STAFF, ADMIN) - Prisma Transaction ─────────
export const approveRequest = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id);

    const lendingRequest = await prisma.lendingRequest.findUnique({
      where: { requestId },
      include: { item: { include: { category: true } } },
    });

    if (!lendingRequest) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (lendingRequest.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Cannot approve request with status: ${lendingRequest.status}.` });
    }

    // Permission check: Item owner, Staff, or Admin
    const isOwner = Number(lendingRequest.item.ownerId) === Number(req.user.userId);
    const isStaffOrAdmin = req.user.role === 'ADMIN' || req.user.role === 'STAFF';
    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ success: false, message: 'Only the item owner or campus circulation staff can approve this request.' });
    }

    // Calculate due date based on borrower's requestedTo or category maxLoanDays
    const maxDays = lendingRequest.item.maxLoanDays || lendingRequest.item.category?.maxLoanDays || 7;
    const dueDate = lendingRequest.requestedTo ? new Date(lendingRequest.requestedTo) : new Date(lendingRequest.requestedFrom);
    if (!lendingRequest.requestedTo) {
      dueDate.setDate(dueDate.getDate() + maxDays);
    }

    // Prisma transaction: approve request + create loan + mark item ON_LOAN
    const [updatedRequest, loan] = await prisma.$transaction([
      prisma.lendingRequest.update({
        where: { requestId },
        data: { status: 'APPROVED' },
      }),
      prisma.loan.create({
        data: {
          requestId,
          dueDate,
          approvedBy: req.user.userId,
        },
      }),
      prisma.item.update({
        where: { itemId: lendingRequest.itemId },
        data: { status: 'ON_LOAN' },
      }),
    ]);

    // Notify borrower of approval
    try {
      await prisma.notification.create({
        data: {
          userId: lendingRequest.borrowerId,
          notificationType: 'GENERAL',
          message: `Your request to borrow "${lendingRequest.item.title}" has been APPROVED. Due date is ${dueDate.toLocaleDateString()}.`,
        },
      });
    } catch (e) {
      console.error('[Notification] approveRequest error:', e.message);
    }

    return res.json({
      success: true,
      message: 'Request approved and loan created.',
      data: { request: updatedRequest, loan },
    });
  } catch (err) {
    next(err);
  }
};

// ── Reject request (Item Owner, STAFF, ADMIN) ────────────────────────────────
export const rejectRequest = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id);
    const { remarks } = req.body;

    const lendingRequest = await prisma.lendingRequest.findUnique({
      where: { requestId },
      include: { item: true },
    });
    if (!lendingRequest) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (lendingRequest.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Cannot reject request with status: ${lendingRequest.status}.` });
    }

    // Permission check: Item owner, Staff, or Admin
    const isOwner = Number(lendingRequest.item.ownerId) === Number(req.user.userId);
    const isStaffOrAdmin = req.user.role === 'ADMIN' || req.user.role === 'STAFF';
    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ success: false, message: 'Only the item owner or campus circulation staff can reject this request.' });
    }

    const updated = await prisma.lendingRequest.update({
      where: { requestId },
      data: { status: 'REJECTED', remarks: remarks || lendingRequest.remarks },
    });

    // Notify borrower of rejection
    try {
      await prisma.notification.create({
        data: {
          userId: lendingRequest.borrowerId,
          notificationType: 'GENERAL',
          message: `Your request to borrow "${lendingRequest.item?.title || 'an item'}" was DECLINED.${remarks ? ` Reason: ${remarks}` : ''}`,
        },
      });
    } catch (e) {
      console.error('[Notification] rejectRequest error:', e.message);
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ── Cancel own request (STUDENT, only if PENDING) ────────────────────────────
export const cancelRequest = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id);

    const lendingRequest = await prisma.lendingRequest.findUnique({ where: { requestId } });
    if (!lendingRequest) return res.status(404).json({ success: false, message: 'Request not found.' });

    if (lendingRequest.borrowerId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You can only cancel your own requests.' });
    }

    if (lendingRequest.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Only PENDING requests can be cancelled.' });
    }

    const updated = await prisma.lendingRequest.update({
      where: { requestId },
      data: { status: 'CANCELLED' },
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};
