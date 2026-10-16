# CampusLend — Database Layer

This folder contains everything needed to set up, seed, query, and maintain the **campuslend** MySQL 8 database.

---

## File Overview

| File | Purpose |
|---|---|
| `schema.sql` | DDL — creates database, all 11 tables, indexes, views, stored procedure, triggers, and event |
| `seed.sql` | DML — inserts realistic sample data for development/testing |
| `queries.sql` | Analytical SQL queries for reporting |
| `backup_restore.sh` | Bash utility to backup and restore the database |

---

## Quick Start

### 1. Run the Schema

```bash
mysql -h localhost -u root -p < database/schema.sql
```

This will:
- Create the `campuslend` database (if it doesn't already exist)
- Create all **11 tables** with constraints and foreign keys
- Add **5 indexes**
- Create **2 views**
- Register **1 stored procedure** (`sp_return_loan`)
- Register **2 triggers** (`trg_loan_returned`, `trg_validate_request`)
- Register **1 scheduled event** (`ev_last_day_reminder`)

> [!IMPORTANT]
> MySQL user must have `EVENT`, `TRIGGER`, `CREATE ROUTINE`, and `SUPER` (or `SET_ANY_DEFINER`) privileges.

---

### 2. Run the Seed Data

```bash
mysql -h localhost -u root -p < database/seed.sql
```

This inserts sample data:
- **3 roles** — ADMIN, STAFF, STUDENT
- **4 departments** — Computer Science (SCOPE), Electronics (SENSE), Mechanical (SMEC), Chemistry (SCHEME)
- **5 categories** — Textbooks, Electronics/Kits, Lab Equipment, Sports Equipment, Laptops
- **8 users** — 1 admin, 2 staff, 5 students (including *Amani Yadav* `24BCE0246` and *Sanjana B S* `24BCE2516`)
- **10 items** — spread across all categories
- **5 lending requests** — mix of APPROVED and PENDING
- **3 loans** — one overdue, one active, one returned
- **1 fine** — ₹160 for the overdue laptop loan
- **2 reviews**, **3 notifications**, **5 audit log entries**

> [!NOTE]
> All `password_hash` values are set to the placeholder `$2b$12$placeholder`. Replace these with real bcrypt hashes before use in production.

---

### 3. Run Analytical Queries

```bash
mysql -h localhost -u root -p campuslend < database/queries.sql
```

Or open in any MySQL client (e.g., MySQL Workbench, DBeaver) and run individual queries.

---

### 4. Backup & Restore

First, make the script executable:

```bash
chmod +x database/backup_restore.sh
```

**Backup:**
```bash
./database/backup_restore.sh backup localhost root yourpassword
```
Creates a timestamped `.sql` file in `database/backups/`.

**Restore:**
```bash
./database/backup_restore.sh restore localhost root yourpassword ./database/backups/campuslend_2026-10-14_083000.sql
```

> [!CAUTION]
> The restore command **drops and recreates** the `campuslend` database. All existing data will be lost.

---

## Database Objects Reference

### Views

| View | Description |
|---|---|
| `v_overdue_loans` | All active loans past their `due_date`, with accrued fine calculation |
| `v_item_availability` | All items currently `AVAILABLE`, with category and owner details |

### Stored Procedure

| Procedure | Parameters | Description |
|---|---|---|
| `sp_return_loan` | `p_loan_id INT`, `p_condition VARCHAR(10)` | Marks a loan returned, calculates overdue days, inserts fine if applicable |

### Triggers

| Trigger | Event | Description |
|---|---|---|
| `trg_loan_returned` | `AFTER UPDATE ON loans` | Sets item status back to `AVAILABLE` and writes an audit log entry when a loan is returned |
| `trg_validate_request` | `BEFORE INSERT ON lending_requests` | Blocks requests if item is unavailable OR borrower has >₹100 in unpaid fines |

### Events

| Event | Schedule | Description |
|---|---|---|
| `ev_last_day_reminder` | Daily at 08:00 | Inserts `DUE_TODAY` notifications for loans due on the current date |

---

## Table Dependency Order

```
roles  departments  categories
   ↘       ↘            ↘
         users  →  items
                      ↘
               lending_requests
                      ↘
                     loans
                    ↙    ↘
                fines   reviews
                   ↘
             notifications
             audit_logs
```
