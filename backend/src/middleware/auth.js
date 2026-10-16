// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// JWT Authentication Middleware
// authMiddleware - verifies JWT from HttpOnly cookie or Authorization Bearer header
// Sets req.user = { userId, email, role, deptId }
// Returns 401 if missing/invalid/expired

import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    let token = null;

    // 1. Check HttpOnly cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // 2. Fallback to Authorization: Bearer <token>
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      deptId: decoded.deptId,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

export default authMiddleware;
