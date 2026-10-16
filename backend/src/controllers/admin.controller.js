// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Admin Controller - Dashboard Stats & Reports

import prisma from '../prismaClient.js';
import { sendLastDayReminders_24BCE0246_24BCE2516 } from '../jobs/reminderJob.js';

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export const getDashboardStats = async (_req, res, next) => {
  try {
    const now = new Date();

    const [
      totalUsers,
      totalItems,
      availableItems,
      activeLoans,
      overdueLoans,
      pendingRequests,
      fineTotals,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.item.count(),
      prisma.item.count({ where: { status: 'AVAILABLE' } }),
      prisma.loan.count({ where: { returnedAt: null } }),
      prisma.loan.count({ where: { returnedAt: null, dueDate: { lt: now } } }),
      prisma.lendingRequest.count({ where: { status: 'PENDING' } }),
      prisma.fine.aggregate({ _sum: { amount: true }, where: { isPaid: false } }),
    ]);

    const unpaidTotal = Number(fineTotals._sum.amount ?? 0);

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalItems,
        availableItems,
        activeLoans,
        overdueLoans,
        overdueCount: overdueLoans,
        pendingRequests,
        totalUnpaidFines: unpaidTotal,
        unpaidFinesTotal: unpaidTotal,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Top 5 Most Borrowed Items ─────────────────────────────────────────────────
export const getTopBorrowedItems = async (_req, res, next) => {
  try {
    const rawResults = await prisma.$queryRaw`
      SELECT
        i.item_id        AS itemId,
        i.title          AS title,
        c.category_name  AS category,
        CAST(COUNT(lr.request_id) AS SIGNED) AS borrowCount,
        CAST(COUNT(lr.request_id) AS SIGNED) AS timesBorrowed
      FROM items i
      JOIN categories c ON i.category_id = c.category_id
      LEFT JOIN lending_requests lr ON i.item_id = lr.item_id AND lr.status IN ('APPROVED', 'RETURNED')
      GROUP BY i.item_id, i.title, c.category_name
      ORDER BY timesBorrowed DESC, i.item_id ASC
      LIMIT 5
    `;

    const results = (rawResults || []).map((r) => ({
      itemId: Number(r.itemId),
      title: r.title,
      category: r.category,
      borrowCount: Number(r.borrowCount || 0),
      timesBorrowed: Number(r.timesBorrowed || 0),
    }));

    return res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

// ── Unpaid Fines Per Department ───────────────────────────────────────────────
export const getDeptFines = async (_req, res, next) => {
  try {
    const rawResults = await prisma.$queryRaw`
      SELECT
        d.dept_id        AS deptId,
        d.dept_name      AS deptName,
        d.dept_name      AS department,
        d.school         AS school,
        CAST(COUNT(f.fine_id) AS SIGNED) AS fineCount,
        COALESCE(SUM(f.amount), 0)       AS totalAmount,
        COALESCE(SUM(f.amount), 0)       AS pendingFines,
        COALESCE(SUM(f.amount), 0)       AS pending_fines
      FROM fines f
      JOIN loans l ON f.loan_id = l.loan_id
      JOIN lending_requests lr ON l.request_id = lr.request_id
      JOIN users u ON lr.borrower_id = u.user_id
      JOIN departments d ON u.dept_id = d.dept_id
      WHERE f.is_paid = FALSE
      GROUP BY d.dept_id, d.dept_name, d.school
      HAVING totalAmount > 0
      ORDER BY totalAmount DESC
    `;

    const results = (rawResults || []).map((r) => ({
      deptId: Number(r.deptId),
      deptName: r.deptName,
      department: r.department,
      school: r.school,
      fineCount: Number(r.fineCount || 0),
      totalAmount: Number(r.totalAmount || 0),
      pendingFines: Number(r.pendingFines || 0),
      pending_fines: Number(r.pending_fines || 0),
    }));

    return res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

// ── Department-wise Item Usage ────────────────────────────────────────────────
export const getUsageReport = async (_req, res, next) => {
  try {
    const rawResults = await prisma.$queryRaw`
      SELECT
        d.dept_id         AS deptId,
        d.dept_name       AS deptName,
        d.dept_name       AS department,
        d.school          AS school,
        CAST(COUNT(lr.request_id) AS SIGNED) AS totalRequests,
        CAST(SUM(CASE WHEN lr.status = 'APPROVED' THEN 1 ELSE 0 END) AS SIGNED) AS approvedLoans,
        CAST(SUM(CASE WHEN lr.status = 'PENDING'  THEN 1 ELSE 0 END) AS SIGNED) AS pendingRequests,
        CAST(SUM(CASE WHEN lr.status = 'REJECTED' THEN 1 ELSE 0 END) AS SIGNED) AS rejectedRequests
      FROM departments d
      LEFT JOIN users u ON u.dept_id = d.dept_id
      LEFT JOIN lending_requests lr ON lr.borrower_id = u.user_id
      GROUP BY d.dept_id, d.dept_name, d.school
      ORDER BY totalRequests DESC
    `;

    const results = (rawResults || []).map((r) => ({
      deptId: Number(r.deptId),
      deptName: r.deptName,
      department: r.department,
      school: r.school,
      totalRequests: Number(r.totalRequests || 0),
      approvedLoans: Number(r.approvedLoans || 0),
      pendingRequests: Number(r.pendingRequests || 0),
      rejectedRequests: Number(r.rejectedRequests || 0),
    }));

    return res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

// ── Paginated Audit Logs ──────────────────────────────────────────────────────
export const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { userId: true, fullName: true, email: true } },
        },
        orderBy: { loggedAt: 'desc' },
      }),
      prisma.auditLog.count(),
    ]);

    return res.json({
      success: true,
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── Manually trigger reminder job (for demo) ──────────────────────────────────
export const runRemindersManually = async (_req, res, next) => {
  try {
    const count = await sendLastDayReminders_24BCE0246_24BCE2516();
    return res.json({
      success: true,
      message: `Reminder job executed. Sent ${count} DUE_TODAY notifications.`,
    });
  } catch (err) {
    next(err);
  }
};
