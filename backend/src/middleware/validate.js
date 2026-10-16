// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// express-validator result helper middleware

import { validationResult } from 'express-validator';

/**
 * Runs express-validator checks and returns 422 with errors if any.
 * Use after validator chain in route definition.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  next();
};
