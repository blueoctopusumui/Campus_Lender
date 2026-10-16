// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Last-Day Return Reminder Job
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
// Runs daily at 08:00 IST

import cron from 'node-cron';
import prisma from '../prismaClient.js';

export async function sendLastDayReminders_24BCE0246_24BCE2516() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const loans = await prisma.loan.findMany({
    where: {
      returnedAt: null,
      dueDate: { gte: start, lt: end },
    },
    include: {
      request: {
        include: { item: true },
      },
    },
  });

  const result = await prisma.notification.createMany({
    data: loans.map((l) => ({
      userId: l.request.borrowerId,
      loanId: l.loanId,
      notificationType: 'DUE_TODAY',
      message: `Last day to return "${l.request.item.title}" is today (${l.dueDate.toISOString().split('T')[0]}).`,
    })),
    skipDuplicates: true,
  });

  console.log(`[ReminderJob] ${new Date().toISOString()} - Sent ${result.count} DUE_TODAY notifications`);
  return result.count;
}

// Schedule daily at 08:00 IST
cron.schedule('0 8 * * *', sendLastDayReminders_24BCE0246_24BCE2516, { timezone: 'Asia/Kolkata' });

export function startReminderJob() {
  console.log('[ReminderJob] Scheduled daily reminder at 08:00 IST');
}
