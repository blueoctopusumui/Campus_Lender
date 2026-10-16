-- ============================================================
-- CampusLend - Seed Data
-- Run AFTER schema.sql
-- ============================================================

USE campuslend;

-- ============================================================
-- ROLES (3)
-- ============================================================
INSERT INTO roles (role_name, description) VALUES
  ('ADMIN',   'System administrator with full access'),
  ('STAFF',   'Library/lab staff who manage items and approve loans'),
  ('STUDENT', 'Registered student who can borrow items');

-- ============================================================
-- DEPARTMENTS (4)
-- ============================================================
INSERT INTO departments (dept_name, school) VALUES
  ('Computer Science',  'SCOPE'),
  ('Electronics',       'SENSE'),
  ('Mechanical',        'SMEC'),
  ('Chemistry',         'SCHEME');

-- ============================================================
-- CATEGORIES (5)
-- ============================================================
INSERT INTO categories (category_name, max_loan_days, fine_per_day) VALUES
  ('Textbooks',         14,  2.00),
  ('Electronics/Kits',   7, 10.00),
  ('Lab Equipment',      3, 15.00),
  ('Sports Equipment',   2,  5.00),
  ('Laptops',            5, 20.00);

-- ============================================================
-- USERS (8)  password_hash is a bcrypt placeholder
-- role_id:  1=ADMIN, 2=STAFF, 3=STUDENT
-- dept_id:  1=CS, 2=Electronics, 3=Mechanical, 4=Chemistry
-- ============================================================
INSERT INTO users (full_name, email, reg_no, password_hash, phone, role_id, dept_id) VALUES
  -- Admin
  ('Dr. Ramesh Kumar',  'ramesh.kumar@vit.ac.in',   NULL,        '$2b$12$placeholder', '9000000001', 1, 1),
  -- Staff
  ('Priya Nair',        'priya.nair@vit.ac.in',     NULL,        '$2b$12$placeholder', '9000000002', 2, 2),
  ('Arun Menon',        'arun.menon@vit.ac.in',     NULL,        '$2b$12$placeholder', '9000000003', 2, 3),
  -- Students
  ('Amani Yadav',       'amani.yadav@vitstudent.ac.in',  '24BCE0246', '$2b$12$placeholder', '9100000001', 3, 1),
  ('Sanjana B S',       'sanjana.bs@vitstudent.ac.in',   '24BCE2516', '$2b$12$placeholder', '9100000002', 3, 1),
  ('Karthik Rajan',     'karthik.rajan@vitstudent.ac.in','24BEC0318', '$2b$12$placeholder', '9100000003', 3, 2),
  ('Divya Suresh',      'divya.suresh@vitstudent.ac.in', '24BME1104', '$2b$12$placeholder', '9100000004', 3, 3),
  ('Nikhil Sharma',     'nikhil.sharma@vitstudent.ac.in','24BCH0727', '$2b$12$placeholder', '9100000005', 3, 4);

-- ============================================================
-- ITEMS (10)
-- owner_id=2 (staff Priya) manages most items
-- ============================================================
INSERT INTO items (title, description, item_condition, status, owner_id, category_id) VALUES
  ('Database System Concepts - 7th Ed.',    'Silberschatz, Korth & Sudarshan',           'GOOD', 'AVAILABLE',   2, 1),
  ('Operating System Concepts - 10th Ed.',  'Silberschatz & Galvin',                     'GOOD', 'AVAILABLE',   2, 1),
  ('Arduino Uno Starter Kit',               'Arduino Uno R3 + breadboard + components',  'NEW',  'AVAILABLE',   2, 2),
  ('Raspberry Pi 4 Model B (4GB)',          'Single-board computer with accessories',    'NEW',  'AVAILABLE',   2, 2),
  ('Digital Multimeter (Fluke 107)',        'Handheld CAT III 600V multimeter',          'GOOD', 'AVAILABLE',   3, 3),
  ('Vernier Caliper (150mm)',               'Stainless steel, 0.02mm least count',       'GOOD', 'AVAILABLE',   3, 3),
  ('Badminton Racket Set',                  'Pair of Yonex rackets + 6 shuttlecocks',   'FAIR', 'AVAILABLE',   2, 4),
  ('Cricket Bat (Ceat Magnum)',             'English willow, full size',                 'FAIR', 'AVAILABLE',   2, 4),
  ('Dell Latitude 5520 Laptop',            '11th Gen Core i5, 16GB RAM, 512GB SSD',    'GOOD', 'AVAILABLE',   1, 5),
  ('HP EliteBook 840 G8',                  '11th Gen Core i7, 16GB RAM, 512GB SSD',    'NEW',  'AVAILABLE',   1, 5);

-- ============================================================
-- LENDING REQUESTS (5)
-- borrower_ids: 4=Amani, 5=Sanjana, 6=Karthik, 7=Divya, 8=Nikhil
-- ============================================================
INSERT INTO lending_requests (item_id, borrower_id, requested_from, requested_to, status, remarks) VALUES
  (9,  4, '2026-10-01', '2026-10-06', 'APPROVED', 'Need for project presentation'),   -- loan 1 (overdue)
  (3,  5, '2026-10-05', '2026-10-12', 'APPROVED', 'IoT lab assignment'),              -- loan 2 (active)
  (1,  6, '2026-10-08', '2026-10-22', 'APPROVED', 'Mid-semester exam prep'),          -- loan 3 (returned)
  (7,  7, '2026-10-10', '2026-10-12', 'PENDING',  'Sports day practice'),
  (5,  8, '2026-10-12', '2026-10-15', 'PENDING',  'Chemistry lab experiment');

-- ============================================================
-- LOANS (3)
-- approved_by=2 (Priya Nair)
-- Loan 1: overdue (due 2026-10-06, not returned)
-- Loan 2: active, on time
-- Loan 3: returned on time
-- ============================================================
INSERT INTO loans (request_id, issued_at, due_date, returned_at, return_condition, approved_by) VALUES
  (1, '2026-10-01 09:30:00', '2026-10-06', NULL,                    NULL,   2),  -- overdue
  (2, '2026-10-05 10:00:00', '2026-10-12', NULL,                    NULL,   2),  -- active
  (3, '2026-10-08 11:15:00', '2026-10-22', '2026-10-18 15:00:00', 'GOOD',  2);  -- returned early

-- ============================================================
-- FINES (1)
-- Loan 1 is overdue by ~8 days at time of seeding;
-- fine_per_day for Laptops = ₹20 → 8 days × ₹20 = ₹160
-- ============================================================
INSERT INTO fines (loan_id, amount, is_paid, paid_on) VALUES
  (1, 160.00, FALSE, NULL);

-- ============================================================
-- REVIEWS (2)
-- ============================================================
INSERT INTO reviews (loan_id, reviewer_id, rating, comment) VALUES
  (3, 6, 5, 'Book was in perfect condition. Very helpful for exam prep.'),
  (3, 2, 4, 'Returned on time and in good condition. Great borrower.');

-- ============================================================
-- NOTIFICATIONS (3)
-- ============================================================
INSERT INTO notifications (user_id, loan_id, notification_type, message, is_read) VALUES
  (4, 1, 'OVERDUE',   'Your loan for "Dell Latitude 5520 Laptop" is overdue by 8 days. Fine accrued: ₹160.', FALSE),
  (5, 2, 'DUE_TODAY', 'Last day to return "Arduino Uno Starter Kit" is today (2026-10-12).',                  FALSE),
  (4, NULL, 'GENERAL', 'Welcome to CampusLend! Please return items on time to avoid fines.',                  TRUE);

-- ============================================================
-- AUDIT LOGS (5)
-- ============================================================
INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES
  (2, 'APPROVED',  'lending_requests', 1),
  (2, 'APPROVED',  'lending_requests', 2),
  (2, 'APPROVED',  'lending_requests', 3),
  (2, 'ISSUED',    'loans',            1),
  (6, 'RETURNED',  'loans',            3);

-- Sync status for items currently on active loans (items 9 and 3)
UPDATE items SET status = 'ON_LOAN' WHERE item_id IN (9, 3);

