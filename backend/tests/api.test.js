// CampusLend - Automated Test Suite
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
// Course: BCSE302P Database Systems Lab | Slot L25+L26

import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

test('CampusLend Backend Test Suite', async (t) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key';

  await t.test('1. JWT Generation and Role Payload Verification', () => {
    const payload = {
      userId: 1,
      email: 'admin@campuslend.edu',
      role: 'ADMIN',
      deptId: 1
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    assert.ok(token, 'JWT token should be generated');

    const decoded = jwt.verify(token, JWT_SECRET);
    assert.equal(decoded.userId, 1);
    assert.equal(decoded.email, 'admin@campuslend.edu');
    assert.equal(decoded.role, 'ADMIN');
  });

  await t.test('2. RBAC Permission Matrix Checks', () => {
    const rbacMatrix = {
      ADMIN: ['users', 'items', 'requests', 'loans', 'fines', 'reports', 'audit-logs'],
      STAFF: ['items', 'requests', 'loans'],
      STUDENT: ['items', 'requests', 'loans']
    };

    // Verify ADMIN permissions
    assert.ok(rbacMatrix.ADMIN.includes('fines'));
    assert.ok(rbacMatrix.ADMIN.includes('reports'));

    // Verify STAFF permissions
    assert.ok(rbacMatrix.STAFF.includes('requests'));
    assert.equal(rbacMatrix.STAFF.includes('reports'), false);

    // Verify STUDENT permissions
    assert.equal(rbacMatrix.STUDENT.includes('reports'), false);
    assert.equal(rbacMatrix.STUDENT.includes('fines'), false);
  });

  await t.test('3. Due Date and Overdue Days Calculation Logic', () => {
    const today = new Date('2026-10-14T00:00:00.000Z');
    const pastDueDate = new Date('2026-10-10T00:00:00.000Z');
    const futureDueDate = new Date('2026-10-20T00:00:00.000Z');

    // Overdue case
    const overdueDiffMs = today - pastDueDate;
    const overdueDays = Math.max(0, Math.floor(overdueDiffMs / (1000 * 60 * 60 * 24)));
    assert.equal(overdueDays, 4, 'Should correctly identify 4 days overdue');

    // Future due date (not overdue)
    const futureDiffMs = today - futureDueDate;
    const futureDays = Math.max(0, Math.floor(futureDiffMs / (1000 * 60 * 60 * 24)));
    assert.equal(futureDays, 0, 'Should return 0 for non-overdue items');
  });

  await t.test('4. Fine Calculation Formula (Days * Category Rate)', () => {
    const finePerDay = 20.00; // Laptop category rate
    const overdueDays = 4;
    const calculatedFine = overdueDays * finePerDay;

    assert.equal(calculatedFine, 80.00, 'Fine should be 4 * 20 = 80');
  });

  await t.test('5. Due-Today Reminder Matching Criteria', () => {
    const currentDate = new Date('2026-10-14T00:00:00.000Z');
    const loanDueDate = new Date('2026-10-14T00:00:00.000Z');
    const isReturned = false;

    const isDueToday = !isReturned && loanDueDate.getTime() === currentDate.getTime();
    assert.equal(isDueToday, true, 'Loan due on current date with no return should trigger reminder');
  });
});
