// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Prisma Seed File - seed_24BCE0246_24BCE2516

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed_24BCE0246_24BCE2516() {
  console.log('🌱 [Seed] Starting CampusLend database seed...');

  // ── Clear existing data (reverse FK order) ──────────────────────────
  console.log('🗑️  [Seed] Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.lendingRequest.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.department.deleteMany();
  await prisma.role.deleteMany();
  console.log('✅ [Seed] Existing data cleared.');

  // ── Roles ────────────────────────────────────────────────────────────
  console.log('👥 [Seed] Creating roles...');
  const [adminRole, staffRole, studentRole] = await Promise.all([
    prisma.role.create({ data: { roleName: 'ADMIN' } }),
    prisma.role.create({ data: { roleName: 'STAFF' } }),
    prisma.role.create({ data: { roleName: 'STUDENT' } }),
  ]);
  console.log(`   ✔ Created roles: ADMIN (${adminRole.roleId}), STAFF (${staffRole.roleId}), STUDENT (${studentRole.roleId})`);

  // ── Departments ──────────────────────────────────────────────────────
  console.log('🏫 [Seed] Creating departments...');
  const [cse, ece, mech, civil] = await Promise.all([
    prisma.department.create({ data: { deptName: 'Computer Science & Engineering' } }),
    prisma.department.create({ data: { deptName: 'Electronics & Communication Engineering' } }),
    prisma.department.create({ data: { deptName: 'Mechanical Engineering' } }),
    prisma.department.create({ data: { deptName: 'Civil Engineering' } }),
  ]);
  console.log(`   ✔ Created 4 departments`);

  // ── Categories ───────────────────────────────────────────────────────
  console.log('📦 [Seed] Creating categories...');
  const [electronics, books, tools, sports, lab] = await Promise.all([
    prisma.category.create({ data: { categoryName: 'Electronics', maxLoanDays: 3, finePerDay: 20.00 } }),
    prisma.category.create({ data: { categoryName: 'Books', maxLoanDays: 14, finePerDay: 2.00 } }),
    prisma.category.create({ data: { categoryName: 'Tools & Equipment', maxLoanDays: 5, finePerDay: 10.00 } }),
    prisma.category.create({ data: { categoryName: 'Sports Equipment', maxLoanDays: 7, finePerDay: 5.00 } }),
    prisma.category.create({ data: { categoryName: 'Lab Instruments', maxLoanDays: 2, finePerDay: 50.00 } }),
  ]);
  console.log(`   ✔ Created 5 categories`);

  // ── Users ────────────────────────────────────────────────────────────
  console.log('👤 [Seed] Creating users...');
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
  const studentPasswordHash = await bcrypt.hash('Student@123', 12);

  const admin = await prisma.user.create({
    data: {
      fullName: 'CampusLend Admin',
      email: 'admin@campuslend.edu',
      regNo: null,
      passwordHash: adminPasswordHash,
      phone: '9000000000',
      roleId: adminRole.roleId,
      deptId: null,
      isActive: true,
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      fullName: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@vit.ac.in',
      regNo: null,
      passwordHash: await bcrypt.hash('Staff@123', 12),
      phone: '9000000001',
      roleId: staffRole.roleId,
      deptId: cse.deptId,
      isActive: true,
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      fullName: 'Ms. Priya Sharma',
      email: 'priya.sharma@vit.ac.in',
      regNo: null,
      passwordHash: await bcrypt.hash('Staff@123', 12),
      phone: '9000000002',
      roleId: staffRole.roleId,
      deptId: ece.deptId,
      isActive: true,
    },
  });

  const student1 = await prisma.user.create({
    data: {
      fullName: 'Amani Yadav',
      email: 'amani.yadav2024@vit.ac.in',
      regNo: '24BCE0246',
      passwordHash: studentPasswordHash,
      phone: '9100000001',
      roleId: studentRole.roleId,
      deptId: cse.deptId,
      isActive: true,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      fullName: 'Sanjana B S',
      email: 'sanjana.bs2024@vit.ac.in',
      regNo: '24BCE2516',
      passwordHash: studentPasswordHash,
      phone: '9100000002',
      roleId: studentRole.roleId,
      deptId: cse.deptId,
      isActive: true,
    },
  });

  const student3 = await prisma.user.create({
    data: {
      fullName: 'Arjun Mehta',
      email: 'arjun.mehta2024@vit.ac.in',
      regNo: '24BCE0101',
      passwordHash: studentPasswordHash,
      phone: '9100000003',
      roleId: studentRole.roleId,
      deptId: ece.deptId,
      isActive: true,
    },
  });

  const student4 = await prisma.user.create({
    data: {
      fullName: 'Divya Nair',
      email: 'divya.nair2024@vit.ac.in',
      regNo: '24BME0045',
      passwordHash: studentPasswordHash,
      phone: '9100000004',
      roleId: studentRole.roleId,
      deptId: mech.deptId,
      isActive: true,
    },
  });

  const student5 = await prisma.user.create({
    data: {
      fullName: 'Kiran Reddy',
      email: 'kiran.reddy2024@vit.ac.in',
      regNo: '24BCE0312',
      passwordHash: studentPasswordHash,
      phone: '9100000005',
      roleId: studentRole.roleId,
      deptId: cse.deptId,
      isActive: true,
    },
  });

  console.log(`   ✔ Created 8 users (1 admin, 2 staff, 5 students)`);

  // ── Items ────────────────────────────────────────────────────────────
  console.log('📋 [Seed] Creating items...');
  await prisma.item.createMany({
    data: [
      { title: 'Arduino Uno R3', description: 'Arduino Uno microcontroller board with USB cable', itemCondition: 'GOOD', status: 'AVAILABLE', ownerId: staff1.userId, categoryId: electronics.categoryId },
      { title: 'Raspberry Pi 4 (4GB)', description: 'Raspberry Pi 4 Model B with 4GB RAM, power supply included', itemCondition: 'GOOD', status: 'AVAILABLE', ownerId: staff1.userId, categoryId: electronics.categoryId },
      { title: 'Digital Multimeter', description: 'Mastech MS8268 digital multimeter with probes', itemCondition: 'GOOD', status: 'AVAILABLE', ownerId: staff2.userId, categoryId: lab.categoryId },
      { title: 'Oscilloscope (Handheld)', description: 'Hantek DSO1102B portable oscilloscope', itemCondition: 'FAIR', status: 'AVAILABLE', ownerId: staff2.userId, categoryId: lab.categoryId },
      { title: 'Introduction to Algorithms (CLRS)', description: 'Thomas H. Cormen - 3rd Edition', itemCondition: 'GOOD', status: 'AVAILABLE', ownerId: staff1.userId, categoryId: books.categoryId },
      { title: 'Database System Concepts', description: 'Silberschatz, Korth & Sudarshan - 7th Edition', itemCondition: 'GOOD', status: 'AVAILABLE', ownerId: staff1.userId, categoryId: books.categoryId },
      { title: 'Soldering Iron Kit', description: 'Hakko FX-888D soldering station with tips and stand', itemCondition: 'GOOD', status: 'AVAILABLE', ownerId: staff2.userId, categoryId: tools.categoryId },
      { title: 'Drill Machine', description: 'Bosch GSB 550 electric drill with bits set', itemCondition: 'FAIR', status: 'AVAILABLE', ownerId: staff2.userId, categoryId: tools.categoryId },
      { title: 'Cricket Bat (MRF)', description: 'MRF Virat Kohli English willow cricket bat', itemCondition: 'GOOD', status: 'AVAILABLE', ownerId: admin.userId, categoryId: sports.categoryId },
      { title: 'Football (Nike)', description: 'Nike Pitch Training football – Size 5', itemCondition: 'GOOD', status: 'AVAILABLE', ownerId: admin.userId, categoryId: sports.categoryId },
    ],
  });
  console.log(`   ✔ Created 10 items`);

  console.log('');
  console.log('🎉 [Seed] CampusLend database seeded successfully!');
  console.log('─'.repeat(50));
  console.log('  Admin login  → admin@campuslend.edu / Admin@123');
  console.log('  Student reg# → 24BCE0246 (Amani), 24BCE2516 (Sanjana)');
  console.log('─'.repeat(50));
}

seed_24BCE0246_24BCE2516()
  .catch((e) => {
    console.error('❌ [Seed] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
