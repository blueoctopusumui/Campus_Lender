// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// RBAC Role-Based Access Control Middleware Factory
// requireRole('ADMIN') or requireRole('ADMIN', 'STAFF')
// Returns 403 if user role not in allowed roles

/**
 * @param {...string} roles - Allowed role names (e.g., 'ADMIN', 'STAFF', 'STUDENT')
 * @returns Express middleware
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
    });
  }

  next();
};
