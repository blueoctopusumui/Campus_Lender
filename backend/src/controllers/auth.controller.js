// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Auth Controller

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';
import { getGoogleAuthUrl, getGoogleUser, isGoogleOAuthConfigured } from '../config/googleOAuth.js';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// ── Google OAuth Status ──────────────────────────────────────────────────────
export const googleStatus_24BCE2516 = (_req, res) => {
  return res.json({
    success: true,
    isConfigured: isGoogleOAuthConfigured(),
  });
};

// ── Google OAuth Redirect ────────────────────────────────────────────────────
export const googleRedirect_24BCE2516 = (_req, res) => {
  if (!isGoogleOAuthConfigured()) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?google_sso=1`);
  }
  const url = getGoogleAuthUrl();
  res.redirect(url);
};

// ── Direct VIT Google SSO / Sign-In ──────────────────────────────────────────
export const googleSSO_24BCE2516 = async (req, res, next) => {
  try {
    const { email, fullName } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Google account email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isVitStudent = cleanEmail.endsWith('@vitstudent.ac.in');
    const isVitStaff   = cleanEmail.endsWith('@vit.ac.in');

    if (!isVitStudent && !isVitStaff) {
      return res.status(403).json({
        success: false,
        message: 'Google Sign-In is restricted to VIT institutional accounts (@vitstudent.ac.in or @vit.ac.in).',
      });
    }

    const enforcedRoleName = isVitStudent ? 'STUDENT' : 'STAFF';

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { role: true, department: true },
    });

    if (!user) {
      const roleRecord = await prisma.role.findFirst({
        where: { roleName: enforcedRoleName },
      });
      if (!roleRecord) {
        return res.status(500).json({ success: false, message: 'Role not found.' });
      }

      const regMatch = cleanEmail.match(/([0-9]{2}[a-z]{3}[0-9]{4})/i);
      const regNo = regMatch ? regMatch[1].toUpperCase() : null;

      user = await prisma.user.create({
        data: {
          fullName: fullName && fullName.trim() ? fullName.trim() : cleanEmail.split('@')[0],
          email: cleanEmail,
          regNo: regNo,
          roleId: roleRecord.roleId,
          isActive: true,
        },
        include: { role: true, department: true },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Contact admin.' });
    }

    const token = signToken({
      userId: user.userId,
      email: user.email,
      role: user.role.roleName,
      deptId: user.deptId,
    });

    res.cookie('token', token, COOKIE_OPTIONS);

    const { passwordHash, ...safeUser } = user;
    return res.json({
      success: true,
      message: 'Signed in with Google successfully.',
      data: {
        ...safeUser,
        role: user.role.roleName,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Google OAuth Callback ────────────────────────────────────────────────────
export const googleCallback_24BCE2516 = async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code missing.' });
    }

    const googleUser = await getGoogleUser(code);
    const cleanEmail = googleUser.email.toLowerCase();
    const isVitStudent = cleanEmail.endsWith('@vitstudent.ac.in');
    const roleName = isVitStudent ? 'STUDENT' : 'STAFF';

    let user = await prisma.user.findUnique({ where: { email: cleanEmail }, include: { role: true } });

    if (!user) {
      const roleRecord = await prisma.role.findFirst({ where: { roleName } });
      if (!roleRecord) throw new Error(`${roleName} role not found in database.`);

      user = await prisma.user.create({
        data: {
          fullName: googleUser.name,
          email: cleanEmail,
          roleId: roleRecord.roleId,
          isActive: true,
        },
        include: { role: true },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact admin.' });
    }

    const token = signToken({
      userId: user.userId,
      email: user.email,
      role: user.role.roleName,
      deptId: user.deptId,
    });

    res.cookie('token', token, COOKIE_OPTIONS);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    next(err);
  }
};

// ── Local Login ──────────────────────────────────────────────────────────────
export const localLogin_24BCE2516 = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // ── Domain check ──────────────────────────────────────────────────────────
    // Allow the seeded system admin (campuslend.edu) plus VIT domains.
    // Students  → @vitstudent.ac.in
    // Staff/Admin → @vit.ac.in
    const isVitStudent = cleanEmail.endsWith('@vitstudent.ac.in');
    const isVitStaff   = cleanEmail.endsWith('@vit.ac.in');
    const isSystemAdmin = cleanEmail === 'admin@campuslend.edu'; // seeded admin only
    if (!isVitStudent && !isVitStaff && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message:
          'Access restricted to VIT email addresses.\n' +
          'Students: yourname@vitstudent.ac.in\n' +
          'Faculty / Staff / Admin: yourname@vit.ac.in',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { role: true, department: true },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken({
      userId: user.userId,
      email: user.email,
      role: user.role.roleName,
      deptId: user.deptId,
    });

    res.cookie('token', token, COOKIE_OPTIONS);

    const { passwordHash, ...safeUser } = user;
    return res.json({
      success: true,
      data: {
        ...safeUser,
        role: user.role?.roleName || user.role,
        roleDetails: user.role,
        hasPassword: !!user.passwordHash,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Logout ───────────────────────────────────────────────────────────────────
export const logout_24BCE2516 = (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.json({ success: true, message: 'Logged out successfully.' });
};

// ── Get Current User ─────────────────────────────────────────────────────────
export const getMe_24BCE2516 = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { userId: req.user.userId },
      include: {
        role: true,
        department: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { passwordHash, ...safeUser } = user;
    return res.json({
      success: true,
      data: {
        ...safeUser,
        role: user.role?.roleName || user.role,
        roleDetails: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// ── User Registration / Enrollment ──────────────────────────────────────────
export const register_24BCE2516 = async (req, res, next) => {
  try {
    const { fullName, email, password, regNo, role, deptId, phone } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // ── Domain-based access control ───────────────────────────────────────────
    // New enrollments are only allowed for VIT email addresses.
    // - Students   : must use @vitstudent.ac.in
    // - Staff/Admin: must use @vit.ac.in
    // The role is auto-derived from domain; the user-supplied 'role' field is
    // only used to differentiate STUDENT vs STAFF within @vit.ac.in.
    const isVitStudent = cleanEmail.endsWith('@vitstudent.ac.in');
    const isVitStaff   = cleanEmail.endsWith('@vit.ac.in');

    if (!isVitStudent && !isVitStaff) {
      return res.status(403).json({
        success: false,
        message:
          'Registration is restricted to VIT institutional email addresses.\n' +
          '• Students: yourname@vitstudent.ac.in\n' +
          '• Faculty / Staff: yourname@vit.ac.in',
      });
    }

    // Derive enforced role from domain (prevents @vitstudent user from claiming STAFF/ADMIN)
    let enforcedRole;
    if (isVitStudent) {
      enforcedRole = 'STUDENT';
    } else {
      // @vit.ac.in — allow STAFF; never allow self-registration as ADMIN
      enforcedRole = role === 'STAFF' ? 'STAFF' : 'STUDENT';
    }

    // Check if email already in use
    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in instead.',
      });
    }

    // Check if regNo already in use
    const cleanRegNo = regNo && regNo.trim() ? regNo.trim().toUpperCase() : null;
    if (cleanRegNo) {
      const existingReg = await prisma.user.findUnique({
        where: { regNo: cleanRegNo },
      });
      if (existingReg) {
        return res.status(400).json({
          success: false,
          message: `Register number ${cleanRegNo} is already registered under another account.`,
        });
      }
    }

    // Lookup enforced role record
    const roleRecord = await prisma.role.findFirst({
      where: { roleName: enforcedRole },
    });
    if (!roleRecord) {
      return res.status(500).json({ success: false, message: `Role ${enforcedRole} not found in database. Contact admin.` });
    }

    // Validate deptId if provided
    let parsedDeptId = deptId ? parseInt(deptId, 10) : null;
    if (parsedDeptId && !isNaN(parsedDeptId)) {
      const deptExists = await prisma.department.findUnique({ where: { deptId: parsedDeptId } });
      if (!deptExists) parsedDeptId = null;
    } else {
      parsedDeptId = null;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: cleanEmail,
        regNo: cleanRegNo,
        passwordHash,
        phone: phone ? phone.trim() : null,
        roleId: roleRecord.roleId,
        deptId: parsedDeptId,
        isActive: true,
      },
      include: {
        role: true,
        department: true,
      },
    });

    // Record audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: newUser.userId,
          action: 'ENROLL',
          tableName: 'users',
          recordId: newUser.userId,
        },
      });
    } catch {
      // ignore log failure
    }

    const token = signToken({
      userId: newUser.userId,
      email: newUser.email,
      role: newUser.role.roleName,
      deptId: newUser.deptId,
    });

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: 'Account successfully registered and enrolled.',
      data: {
        userId: newUser.userId,
        fullName: newUser.fullName,
        email: newUser.email,
        regNo: newUser.regNo,
        role: newUser.role.roleName,
        deptId: newUser.deptId,
        department: newUser.department,
        // Note: token is in the httpOnly cookie only — never exposed in JSON body
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Public Metadata (Departments & Roles) ──────────────────────────────────
export const getEnrollmentMeta_24BCE2516 = async (_req, res, next) => {
  try {
    const [departments, roles] = await Promise.all([
      prisma.department.findMany({ orderBy: { deptName: 'asc' } }),
      prisma.role.findMany({
        where: { roleName: { in: ['STUDENT', 'STAFF'] } },
        orderBy: { roleName: 'desc' },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        departments,
        roles,
      },
    });
  } catch (err) {
    next(err);
  }
};
