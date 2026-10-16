// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Users Controller

import prisma from '../prismaClient.js';
import bcrypt from 'bcryptjs';

const DEFAULT_LIMIT = 20;

// ── List all users (ADMIN, paginated) ────────────────────────────────────────
export const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || DEFAULT_LIMIT);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        include: { role: true, department: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    const safeUsers = users.map(({ passwordHash, ...u }) => u);

    return res.json({
      success: true,
      data: safeUsers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── Get user by ID (ADMIN or self) ───────────────────────────────────────────
export const getUserById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role !== 'ADMIN' && req.user.userId !== id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const user = await prisma.user.findUnique({
      where: { userId: id },
      include: { role: true, department: true },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { passwordHash, ...safeUser } = user;
    return res.json({ success: true, data: safeUser });
  } catch (err) {
    next(err);
  }
};

// ── Update user (ADMIN or self) ───────────────────────────────────────────────
export const updateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role !== 'ADMIN' && req.user.userId !== id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { userId: id } });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const data = {};

    // 1. Full Name
    if (req.body.fullName !== undefined) {
      const cleanName = String(req.body.fullName).trim();
      if (!cleanName) {
        return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
      }
      data.fullName = cleanName;
    }

    // 2. Contact Phone
    if (req.body.phone !== undefined) {
      data.phone = req.body.phone ? String(req.body.phone).trim() : null;
    }

    // 3. Registration Index / Reg No
    if (req.body.regNo !== undefined) {
      const cleanRegNo = req.body.regNo ? String(req.body.regNo).trim().toUpperCase() : null;
      if (cleanRegNo && cleanRegNo !== existingUser.regNo) {
        const duplicate = await prisma.user.findFirst({
          where: { regNo: cleanRegNo, userId: { not: id } }
        });
        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: `Registration index ${cleanRegNo} is already registered under another account.`
          });
        }
      }
      data.regNo = cleanRegNo;
    }

    // 4. Academic Department
    if (req.body.deptId !== undefined) {
      const parsedDept = parseInt(req.body.deptId, 10);
      if (!isNaN(parsedDept) && parsedDept > 0) {
        const deptExists = await prisma.department.findUnique({ where: { deptId: parsedDept } });
        data.deptId = deptExists ? parsedDept : null;
      } else {
        data.deptId = null;
      }
    }

    // 5. Password Updation
    const incomingPassword = req.body.newPassword || req.body.password;
    if (incomingPassword) {
      if (String(incomingPassword).length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
      }

      // If user already has a password and is updating themselves, verify current password
      const isSelf = req.user.userId === id;
      if (existingUser.passwordHash && isSelf) {
        const currentPassword = req.body.currentPassword;
        if (!currentPassword) {
          return res.status(400).json({ success: false, message: 'Current password is required to change password.' });
        }
        const isMatch = await bcrypt.compare(currentPassword, existingUser.passwordHash);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Current password does not match.' });
        }
      }

      data.passwordHash = await bcrypt.hash(String(incomingPassword), 10);
    }

    // 6. Admin-only fields
    if (req.user.role === 'ADMIN') {
      if (req.body.roleId !== undefined) data.roleId = parseInt(req.body.roleId, 10);
      if (req.body.isActive !== undefined) data.isActive = Boolean(req.body.isActive);
    }

    const updated = await prisma.user.update({
      where: { userId: id },
      data,
      include: { role: true, department: true },
    });

    const { passwordHash, ...safeUser } = updated;
    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        ...safeUser,
        role: updated.role?.roleName || updated.role,
        roleDetails: updated.role,
        hasPassword: !!updated.passwordHash,
      }
    });
  } catch (err) {
    next(err);
  }
};

// ── Soft delete user (ADMIN only) ────────────────────────────────────────────
export const deleteUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.user.update({
      where: { userId: id },
      data: { isActive: false },
    });
    return res.json({ success: true, message: 'User deactivated successfully.' });
  } catch (err) {
    next(err);
  }
};

// ── Get user's loans ─────────────────────────────────────────────────────────
export const getUserLoans = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role === 'STUDENT' && req.user.userId !== id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const loans = await prisma.loan.findMany({
      where: { request: { borrowerId: id } },
      include: {
        request: { include: { item: { include: { category: true } } } },
        fine: true,
      },
      orderBy: { issuedAt: 'desc' },
    });

    return res.json({ success: true, data: loans });
  } catch (err) {
    next(err);
  }
};

// ── Get user's lending requests ───────────────────────────────────────────────
export const getUserRequests = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role === 'STUDENT' && req.user.userId !== id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const requests = await prisma.lendingRequest.findMany({
      where: { borrowerId: id },
      include: { item: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
};
