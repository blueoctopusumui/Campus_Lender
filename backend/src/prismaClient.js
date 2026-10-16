// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Singleton Prisma Client

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

export default prisma;
