-- ============================================================
-- CampusLend - Analytical Queries
-- Run against the campuslend database
-- ============================================================

USE campuslend;

-- ------------------------------------------------------------
-- Q1: Active Loans
-- All loans currently active (not yet returned), joined with
-- borrower details, item info, and the item's owner
-- ------------------------------------------------------------
SELECT
  l.loan_id,
  l.issued_at,
  l.due_date,
  DATEDIFF(l.due_date, CURDATE())           AS days_remaining,
  borrower.user_id                           AS borrower_id,
  borrower.full_name                         AS borrower_name,
  borrower.reg_no                            AS borrower_reg_no,
  borrower.email                             AS borrower_email,
  i.item_id,
  i.title                                    AS item_title,
  c.category_name,
  owner.full_name                            AS owner_name,
  owner.email                                AS owner_email
FROM loans l
JOIN lending_requests lr ON lr.request_id = l.request_id
JOIN users   borrower    ON borrower.user_id = lr.borrower_id
JOIN items   i           ON i.item_id        = lr.item_id
JOIN categories c        ON c.category_id    = i.category_id
JOIN users   owner       ON owner.user_id    = i.owner_id
WHERE l.returned_at IS NULL
ORDER BY l.due_date ASC;

-- ------------------------------------------------------------
-- Q2: Top 5 Most Borrowed Items
-- Items ranked by total number of approved lending requests
-- ------------------------------------------------------------
SELECT
  i.item_id,
  i.title,
  c.category_name,
  COUNT(lr.request_id)  AS total_borrows
FROM lending_requests lr
JOIN items      i ON i.item_id     = lr.item_id
JOIN categories c ON c.category_id = i.category_id
WHERE lr.status IN ('APPROVED')
GROUP BY i.item_id, i.title, c.category_name
ORDER BY total_borrows DESC
LIMIT 5;

-- ------------------------------------------------------------
-- Q3: Total Unpaid Fines per Department
-- Only departments whose students owe more than ₹0 in total
-- ------------------------------------------------------------
SELECT
  d.dept_name,
  d.school,
  COUNT(DISTINCT u.user_id)   AS students_with_fines,
  SUM(f.amount)               AS total_unpaid_fines
FROM fines f
JOIN loans            l   ON l.loan_id    = f.loan_id
JOIN lending_requests lr  ON lr.request_id = l.request_id
JOIN users            u   ON u.user_id     = lr.borrower_id
JOIN departments      d   ON d.dept_id     = u.dept_id
WHERE f.is_paid = FALSE
GROUP BY d.dept_id, d.dept_name, d.school
HAVING total_unpaid_fines > 0
ORDER BY total_unpaid_fines DESC;

-- ------------------------------------------------------------
-- Q4: Overdue Loans
-- Uses the v_overdue_loans view for a clean report
-- ------------------------------------------------------------
SELECT
  loan_id,
  due_date,
  days_overdue,
  borrower_name,
  borrower_email,
  item_title,
  fine_per_day,
  accrued_fine
FROM v_overdue_loans
ORDER BY days_overdue DESC;

-- ------------------------------------------------------------
-- Q5: Department-wise Item Usage
-- How many times items belonging to each department's staff
-- have been borrowed (approved requests)
-- ------------------------------------------------------------
SELECT
  d.dept_name,
  d.school,
  COUNT(DISTINCT i.item_id)    AS distinct_items,
  COUNT(lr.request_id)         AS total_requests,
  SUM(CASE WHEN lr.status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_loans
FROM items            i
JOIN users            u  ON u.user_id    = i.owner_id
JOIN departments      d  ON d.dept_id    = u.dept_id
LEFT JOIN lending_requests lr ON lr.item_id = i.item_id
GROUP BY d.dept_id, d.dept_name, d.school
ORDER BY approved_loans DESC;

-- ------------------------------------------------------------
-- Q6: Fine Collection Summary
-- Overview of fines: total raised, collected, and outstanding
-- ------------------------------------------------------------
SELECT
  COUNT(*)                                               AS total_fine_records,
  SUM(amount)                                            AS total_fines_raised,
  SUM(CASE WHEN is_paid = TRUE  THEN amount ELSE 0 END) AS total_collected,
  SUM(CASE WHEN is_paid = FALSE THEN amount ELSE 0 END) AS total_outstanding,
  COUNT(CASE WHEN is_paid = FALSE THEN 1 END)           AS unpaid_count,
  COUNT(CASE WHEN is_paid = TRUE  THEN 1 END)           AS paid_count
FROM fines;
