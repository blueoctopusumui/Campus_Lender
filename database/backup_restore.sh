#!/usr/bin/env bash
# ============================================================
# CampusLend - Database Backup & Restore Script
# ============================================================
#
# Usage:
#   ./backup_restore.sh backup  [host] [user] [password]
#   ./backup_restore.sh restore [host] [user] [password] [backup_file]
#
# Examples:
#   ./backup_restore.sh backup  localhost root mypassword
#   ./backup_restore.sh restore localhost root mypassword ./backups/campuslend_2026-10-14_083000.sql
#
# After downloading, make executable with:
#   chmod +x backup_restore.sh
#
# Requirements: mysqldump and mysql must be in PATH
# ============================================================

set -euo pipefail

DB_NAME="campuslend"
BACKUP_DIR="$(dirname "$0")/backups"

# Defaults (override via positional arguments)
DB_HOST="${2:-localhost}"
DB_USER="${3:-root}"
DB_PASS="${4:-}"

# ============================================================
# backup()
# Creates a timestamped dump of the campuslend database
# including routines, triggers, and events.
# ============================================================
backup() {
  mkdir -p "$BACKUP_DIR"

  TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
  BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql"

  echo "==> Starting backup of '${DB_NAME}' ..."
  echo "    Host : ${DB_HOST}"
  echo "    User : ${DB_USER}"
  echo "    File : ${BACKUP_FILE}"

  mysqldump \
    --host="${DB_HOST}" \
    --user="${DB_USER}" \
    --password="${DB_PASS}" \
    --routines \
    --triggers \
    --events \
    --single-transaction \
    --set-gtid-purged=OFF \
    "${DB_NAME}" > "${BACKUP_FILE}"

  echo "==> Backup complete: ${BACKUP_FILE}"
}

# ============================================================
# restore()
# Drops and recreates the campuslend database, then imports
# the specified backup file.
# Usage: restore <backup_file>
# ============================================================
restore() {
  BACKUP_FILE="${5:-}"

  if [[ -z "${BACKUP_FILE}" ]]; then
    echo "ERROR: No backup file specified."
    echo "Usage: $0 restore [host] [user] [password] <backup_file>"
    exit 1
  fi

  if [[ ! -f "${BACKUP_FILE}" ]]; then
    echo "ERROR: Backup file not found: ${BACKUP_FILE}"
    exit 1
  fi

  echo "==> Preparing to restore '${DB_NAME}' from: ${BACKUP_FILE}"
  echo "    Host : ${DB_HOST}"
  echo "    User : ${DB_USER}"

  # Drop and recreate the database to ensure a clean slate
  mysql \
    --host="${DB_HOST}" \
    --user="${DB_USER}" \
    --password="${DB_PASS}" \
    --execute="DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

  echo "==> Importing backup ..."
  mysql \
    --host="${DB_HOST}" \
    --user="${DB_USER}" \
    --password="${DB_PASS}" \
    "${DB_NAME}" < "${BACKUP_FILE}"

  echo "==> Restore complete."
}

# ============================================================
# Entry point
# ============================================================
COMMAND="${1:-help}"

case "${COMMAND}" in
  backup)
    backup
    ;;
  restore)
    restore "$@"
    ;;
  *)
    echo ""
    echo "CampusLend Database Backup & Restore Utility"
    echo "--------------------------------------------"
    echo "Usage:"
    echo "  $0 backup  [host] [user] [password]"
    echo "  $0 restore [host] [user] [password] <backup_file>"
    echo ""
    echo "Examples:"
    echo "  $0 backup  localhost root secret"
    echo "  $0 restore localhost root secret ./backups/campuslend_2026-10-14_083000.sql"
    echo ""
    exit 0
    ;;
esac
