# CampusLend 🎓

**A Secure, Role-Based Lending and Borrowing Management System for College Campuses**

> **Course:** BCSE302P – Database Systems Lab | Fall Semester 2026-27
> **Authors:** Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
> **Faculty:** Dr. V. Sivakumar | Slot: L25+L26

---

## 📋 Overview

CampusLend replaces WhatsApp groups and paper registers with a proper relational-database-backed web application where items are listed, requested, approved, issued, returned, and reviewed — with overdue tracking, automatic fines, audit logs, and role-based access.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Vite) + Tailwind CSS |
| Backend | Express.js (Node.js 20) |
| Database | MySQL 8 |
| ORM | Prisma |
| Auth | Google OAuth 2.0 + JWT (HttpOnly cookie) |
| Password | BCrypt (cost 12) |
| Scheduler | node-cron (last-day reminders) |
| DevOps | GitHub, Docker, GitHub Actions |
| Deployment | Render (backend), Vercel (frontend), Aiven MySQL |

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MySQL 8
- Git

### 1. Clone the repository
```bash
git clone https://github.com/<your-org>/campuslend.git
cd campuslend
```

### 2. Database setup
```bash
# Create the database and all tables
mysql -u root -p < database/schema.sql

# Seed sample data
mysql -u root -p campuslend < database/seed.sql
```

### 3. Backend setup
```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

npm install
npm run db:generate     # Generate Prisma client
npm run dev             # Start backend on http://localhost:5000
```

### 4. Frontend setup
```bash
cd frontend
npm install
npm run dev             # Start frontend on http://localhost:5173
```

## 📁 Project Structure

```
campuslend/
├── database/
│   ├── schema.sql          # Full DDL: tables, indexes, views, procedure, triggers, event
│   ├── seed.sql            # Sample data
│   ├── queries.sql         # Analytical queries (joins, aggregates)
│   └── backup_restore.sh   # Backup & restore scripts
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # Prisma ORM schema (all 11 models)
│   │   └── seed.js         # Prisma seed script
│   └── src/
│       ├── index.js        # Express app entry point
│       ├── prismaClient.js # Singleton Prisma client
│       ├── config/         # Google OAuth config
│       ├── middleware/     # auth, requireRole, errorHandler, validate
│       ├── routes/         # All API routes
│       ├── controllers/    # Business logic
│       └── jobs/           # node-cron reminder job
└── frontend/
    └── src/
        ├── api/            # Axios instance
        ├── context/        # AuthContext
        ├── components/     # Layout, Navbar, Sidebar, NotificationBell, etc.
        └── pages/          # Login, Dashboard, Items, Requests, Loans, Notifications, Admin/*
```

## 🔐 Roles & Access

| Role | Access |
|------|--------|
| **ADMIN** | All pages: users, items, requests, loans, fines, reports, audit logs |
| **STAFF** | Own items, approve/reject requests, issue & return loans |
| **STUDENT** | Browse catalogue, request items, view own loans, write reviews |

## 📦 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/auth/google | Redirect to Google OAuth |
| GET | /api/auth/google/callback | OAuth callback |
| POST | /api/auth/login | Admin local login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Current user |
| GET | /api/items | List items (search, filter, paginate) |
| POST | /api/items | Create item (STAFF/ADMIN) |
| GET | /api/requests | List requests |
| POST | /api/requests | Create request (STUDENT) |
| PUT | /api/requests/:id/approve | Approve (STAFF/ADMIN) |
| GET | /api/loans | List loans |
| POST | /api/loans/:id/return | Return item (STAFF/ADMIN) |
| GET | /api/notifications/unread-count | Bell badge count |
| GET | /api/admin/dashboard | Admin stats |
| GET | /api/admin/reports/top-items | Top 5 borrowed items |

## 🗄️ Database Objects

| Type | Name | Purpose |
|------|------|---------|
| View | `v_overdue_loans` | Loans past due date |
| View | `v_item_availability` | Available items catalogue |
| Procedure | `sp_return_loan` | Return item + compute fine |
| Trigger | `trg_loan_returned` | Set item AVAILABLE + audit log |
| Trigger | `trg_validate_request` | Block request if item unavailable or fines > ₹100 |
| Event | `ev_last_day_reminder` | Daily 08:00 IST DUE_TODAY notifications |

## ⏰ Last-Day Reminder Feature

A `node-cron` job runs every day at **08:00 IST**. It finds all loans due today and inserts `DUE_TODAY` notifications for the borrowers. A unique constraint on `(loan_id, notification_type)` prevents duplicate reminders.

The frontend shows:
- 🔔 **Badge** on the notification bell
- 🟡 **Banner** on the dashboard: *"Last day to return [item] is today"*

To test: set a loan's `due_date` to today, then call `POST /api/admin/run-reminders`.

## 💾 Backup & Restore

```bash
# Backup (includes routines, triggers, events)
mysqldump -u root -p --routines --triggers --events --single-transaction campuslend > campuslend_backup.sql

# Restore
mysql -u root -p -e "CREATE DATABASE campuslend_restored"
mysql -u root -p campuslend_restored < campuslend_backup.sql
```

Or use the script: `bash database/backup_restore.sh backup`

## 🌿 Git Workflow

- `main` — stable, production-ready
- `dev` — active development, merged via Pull Requests
- Commit convention: `feat:`, `fix:`, `docs:`, `chore:`, `test:`

## 📄 License

Academic project for VIT University, Fall 2026-27.
