-- ============================================================
-- CampusLend - College Lending & Borrowing System
-- Database Schema (MySQL 8)
-- ============================================================

CREATE DATABASE IF NOT EXISTS campuslend
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campuslend;

-- ============================================================
-- TABLE 1: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  role_id    INT          NOT NULL AUTO_INCREMENT,
  role_name  VARCHAR(20)  NOT NULL,
  description TEXT,
  PRIMARY KEY (role_id),
  CONSTRAINT uq_roles_name UNIQUE (role_name)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 2: departments
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  dept_id   INT         NOT NULL AUTO_INCREMENT,
  dept_name VARCHAR(80) NOT NULL,
  school    VARCHAR(40),
  PRIMARY KEY (dept_id),
  CONSTRAINT uq_departments_name UNIQUE (dept_name)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 3: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  category_id   INT            NOT NULL AUTO_INCREMENT,
  category_name VARCHAR(60)    NOT NULL,
  max_loan_days INT            NOT NULL DEFAULT 7,
  fine_per_day  DECIMAL(6,2)   NOT NULL DEFAULT 5.00,
  PRIMARY KEY (category_id),
  CONSTRAINT uq_categories_name UNIQUE (category_name),
  CONSTRAINT chk_categories_loan_days CHECK (max_loan_days > 0),
  CONSTRAINT chk_categories_fine      CHECK (fine_per_day >= 0)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 4: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id       INT          NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(120) NOT NULL,
  reg_no        VARCHAR(15),
  password_hash VARCHAR(255) NULL,
  phone         VARCHAR(15),
  role_id       INT          NOT NULL,
  dept_id       INT,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT uq_users_email  UNIQUE (email),
  CONSTRAINT uq_users_reg_no UNIQUE (reg_no),
  CONSTRAINT fk_users_role   FOREIGN KEY (role_id) REFERENCES roles(role_id),
  CONSTRAINT fk_users_dept   FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 5: items
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
  item_id        INT          NOT NULL AUTO_INCREMENT,
  title          VARCHAR(150) NOT NULL,
  description    TEXT,
  item_condition VARCHAR(10),
  status         VARCHAR(15)  NOT NULL DEFAULT 'AVAILABLE',
  owner_id       INT          NOT NULL,
  category_id    INT          NOT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_id),
  CONSTRAINT chk_items_condition CHECK (item_condition IN ('NEW','GOOD','FAIR','POOR')),
  CONSTRAINT chk_items_status    CHECK (status IN ('AVAILABLE','ON_LOAN','MAINTENANCE')),
  CONSTRAINT fk_items_owner      FOREIGN KEY (owner_id)    REFERENCES users(user_id),
  CONSTRAINT fk_items_category   FOREIGN KEY (category_id) REFERENCES categories(category_id),
  FULLTEXT KEY idx_items_title (title, description)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 6: lending_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS lending_requests (
  request_id     INT         NOT NULL AUTO_INCREMENT,
  item_id        INT         NOT NULL,
  borrower_id    INT         NOT NULL,
  requested_from DATE        NOT NULL,
  requested_to   DATE        NOT NULL,
  status         VARCHAR(10) NOT NULL DEFAULT 'PENDING',
  remarks        TEXT,
  created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (request_id),
  CONSTRAINT chk_requests_status    CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
  CONSTRAINT chk_requests_date_range CHECK (requested_to > requested_from),
  CONSTRAINT fk_requests_item       FOREIGN KEY (item_id)     REFERENCES items(item_id),
  CONSTRAINT fk_requests_borrower   FOREIGN KEY (borrower_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 7: loans
-- ============================================================
CREATE TABLE IF NOT EXISTS loans (
  loan_id          INT         NOT NULL AUTO_INCREMENT,
  request_id       INT         NOT NULL,
  issued_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date         DATE        NOT NULL,
  returned_at      DATETIME    NULL,
  return_condition VARCHAR(10),
  approved_by      INT,
  PRIMARY KEY (loan_id),
  CONSTRAINT uq_loans_request       UNIQUE (request_id),
  CONSTRAINT chk_loans_condition    CHECK (return_condition IN ('NEW','GOOD','FAIR','POOR')),
  CONSTRAINT fk_loans_request       FOREIGN KEY (request_id) REFERENCES lending_requests(request_id),
  CONSTRAINT fk_loans_approved_by   FOREIGN KEY (approved_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 8: fines
-- ============================================================
CREATE TABLE IF NOT EXISTS fines (
  fine_id    INT           NOT NULL AUTO_INCREMENT,
  loan_id    INT           NOT NULL,
  amount     DECIMAL(8,2)  NOT NULL,
  is_paid    BOOLEAN       NOT NULL DEFAULT FALSE,
  paid_on    DATETIME      NULL,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (fine_id),
  CONSTRAINT chk_fines_amount CHECK (amount >= 0),
  CONSTRAINT fk_fines_loan    FOREIGN KEY (loan_id) REFERENCES loans(loan_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 9: reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  review_id   INT       NOT NULL AUTO_INCREMENT,
  loan_id     INT       NOT NULL,
  reviewer_id INT       NOT NULL,
  rating      INT       NOT NULL,
  comment     TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id),
  CONSTRAINT chk_reviews_rating   CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_loan      FOREIGN KEY (loan_id)     REFERENCES loans(loan_id),
  CONSTRAINT fk_reviews_reviewer  FOREIGN KEY (reviewer_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 10: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  notification_id   INT         NOT NULL AUTO_INCREMENT,
  user_id           INT         NOT NULL,
  loan_id           INT         NULL,
  notification_type VARCHAR(15) NOT NULL DEFAULT 'GENERAL',
  message           TEXT        NOT NULL,
  is_read           BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id),
  CONSTRAINT uq_notif_loan_type  UNIQUE KEY (loan_id, notification_type),
  CONSTRAINT chk_notif_type      CHECK (notification_type IN ('GENERAL','DUE_TODAY','OVERDUE')),
  CONSTRAINT fk_notif_user       FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_notif_loan       FOREIGN KEY (loan_id) REFERENCES loans(loan_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 11: audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id     INT         NOT NULL AUTO_INCREMENT,
  user_id    INT         NULL,
  action     VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id  INT,
  logged_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE UNIQUE INDEX idx_users_email            ON users(email);
CREATE INDEX idx_items_status_category         ON items(status, category_id);
CREATE INDEX idx_requests_borrower             ON lending_requests(borrower_id, status);
CREATE INDEX idx_loans_due_returned            ON loans(due_date, returned_at);
CREATE INDEX idx_notifications_user_unread     ON notifications(user_id, is_read);

-- ============================================================
-- VIEW 1: v_overdue_loans
-- Returns all active loans whose due_date has passed
-- ============================================================
CREATE VIEW v_overdue_loans AS
SELECT
  l.loan_id,
  l.due_date,
  DATEDIFF(CURDATE(), l.due_date)              AS days_overdue,
  u.user_id                                    AS borrower_id,
  u.full_name                                  AS borrower_name,
  u.email                                      AS borrower_email,
  i.item_id,
  i.title                                      AS item_title,
  c.fine_per_day,
  DATEDIFF(CURDATE(), l.due_date) * c.fine_per_day AS accrued_fine
FROM loans l
JOIN lending_requests lr ON lr.request_id = l.request_id
JOIN users            u  ON u.user_id      = lr.borrower_id
JOIN items            i  ON i.item_id      = lr.item_id
JOIN categories       c  ON c.category_id  = i.category_id
WHERE l.returned_at IS NULL
  AND l.due_date < CURDATE();

-- ============================================================
-- VIEW 2: v_item_availability
-- Returns all items currently available for borrowing
-- ============================================================
CREATE VIEW v_item_availability AS
SELECT
  i.item_id,
  i.title,
  i.description,
  i.item_condition,
  c.category_name,
  c.max_loan_days,
  c.fine_per_day,
  u.user_id    AS owner_id,
  u.full_name  AS owner_name,
  u.email      AS owner_email,
  d.dept_name  AS owner_department
FROM items      i
JOIN categories c ON c.category_id = i.category_id
JOIN users      u ON u.user_id     = i.owner_id
LEFT JOIN departments d ON d.dept_id = u.dept_id
WHERE i.status = 'AVAILABLE';

-- ============================================================
-- STORED PROCEDURE: sp_return_loan
-- Marks a loan as returned, updates item status, and
-- calculates + inserts a fine if the loan is overdue
-- ============================================================
DELIMITER $$

CREATE PROCEDURE sp_return_loan (
  IN p_loan_id   INT,
  IN p_condition VARCHAR(10)
)
BEGIN
  DECLARE v_due_date      DATE;
  DECLARE v_fine_per_day  DECIMAL(6,2);
  DECLARE v_overdue_days  INT;
  DECLARE v_fine_amount   DECIMAL(8,2);

  -- Fetch due_date and fine_per_day via the loan → request → item → category chain
  SELECT l.due_date, c.fine_per_day
    INTO v_due_date, v_fine_per_day
    FROM loans            l
    JOIN lending_requests lr ON lr.request_id = l.request_id
    JOIN items            i  ON i.item_id      = lr.item_id
    JOIN categories       c  ON c.category_id  = i.category_id
   WHERE l.loan_id = p_loan_id;

  -- Mark loan as returned with the supplied condition
  UPDATE loans
     SET returned_at      = NOW(),
         return_condition = p_condition
   WHERE loan_id = p_loan_id;

  -- Calculate overdue days (0 if returned on time or early)
  SET v_overdue_days = GREATEST(DATEDIFF(CURDATE(), v_due_date), 0);

  -- Insert a fine record only when the loan is genuinely overdue
  IF v_overdue_days > 0 THEN
    SET v_fine_amount = v_overdue_days * v_fine_per_day;
    INSERT INTO fines (loan_id, amount, is_paid)
    VALUES (p_loan_id, v_fine_amount, FALSE);
  END IF;

END$$

DELIMITER ;

-- ============================================================
-- TRIGGER 1: trg_loan_returned
-- AFTER UPDATE on loans
-- When a loan is marked returned, set item back to AVAILABLE
-- and write an audit log entry
-- ============================================================
DELIMITER $$

CREATE TRIGGER trg_loan_returned
AFTER UPDATE ON loans
FOR EACH ROW
BEGIN
  IF NEW.returned_at IS NOT NULL AND OLD.returned_at IS NULL THEN

    -- Restore item availability
    UPDATE items
       SET status = 'AVAILABLE'
     WHERE item_id = (
       SELECT item_id
         FROM lending_requests
        WHERE request_id = NEW.request_id
     );

    -- Record the return action in the audit log
    INSERT INTO audit_logs (action, table_name, record_id)
    VALUES ('RETURNED', 'loans', NEW.loan_id);

  END IF;
END$$

DELIMITER ;

-- ============================================================
-- TRIGGER 2: trg_validate_request
-- BEFORE INSERT on lending_requests
-- Prevents requests for unavailable items or borrowers
-- who have accumulated more than ₹100 in unpaid fines
-- ============================================================
DELIMITER $$

CREATE TRIGGER trg_validate_request
BEFORE INSERT ON lending_requests
FOR EACH ROW
BEGIN
  DECLARE v_item_status  VARCHAR(15);
  DECLARE v_unpaid_fines DECIMAL(10,2);

  -- Check item availability
  SELECT status INTO v_item_status
    FROM items
   WHERE item_id = NEW.item_id;

  IF v_item_status != 'AVAILABLE' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Item is not available for lending';
  END IF;

  -- Check for outstanding fines exceeding ₹100
  SELECT COALESCE(SUM(f.amount), 0) INTO v_unpaid_fines
    FROM fines f
    JOIN loans l ON l.loan_id = f.loan_id
    JOIN lending_requests lr ON lr.request_id = l.request_id
   WHERE lr.borrower_id = NEW.borrower_id
     AND f.is_paid = FALSE;

  IF v_unpaid_fines > 100 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot request: you have unpaid fines exceeding ₹100';
  END IF;

END$$

DELIMITER ;

-- ============================================================
-- EVENT: ev_last_day_reminder
-- Fires daily at 08:00 to notify borrowers whose loan
-- is due today (DUE_TODAY notifications)
-- ============================================================
SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS ev_last_day_reminder
  ON SCHEDULE EVERY 1 DAY
  STARTS TIMESTAMP(CURDATE(), '08:00:00')
  DO
    INSERT IGNORE INTO notifications (user_id, loan_id, notification_type, message)
    SELECT
      r.borrower_id,
      l.loan_id,
      'DUE_TODAY',
      CONCAT('Last day to return "', i.title, '" is today (', l.due_date, ').')
    FROM loans            l
    JOIN lending_requests r ON r.request_id = l.request_id
    JOIN items            i ON i.item_id     = r.item_id
    WHERE l.returned_at IS NULL
      AND l.due_date = CURDATE();
