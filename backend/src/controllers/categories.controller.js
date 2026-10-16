// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Categories Controller

import prisma from '../prismaClient.js';

// ── List all categories ───────────────────────────────────────────────────────
export const listCategories = async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { categoryName: 'asc' },
      include: { _count: { select: { items: true } } },
    });
    return res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

// ── Get category by ID ────────────────────────────────────────────────────────
export const getCategoryById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const category = await prisma.category.findUnique({
      where: { categoryId: id },
      include: { _count: { select: { items: true } } },
    });

    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    return res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// ── Create category (ADMIN) ───────────────────────────────────────────────────
export const createCategory = async (req, res, next) => {
  try {
    const { categoryName, maxLoanDays, finePerDay } = req.body;

    if (!categoryName) {
      return res.status(400).json({ success: false, message: 'categoryName is required.' });
    }

    const category = await prisma.category.create({
      data: {
        categoryName,
        maxLoanDays: maxLoanDays ? parseInt(maxLoanDays) : 7,
        finePerDay: finePerDay ? parseFloat(finePerDay) : 5.0,
      },
    });

    return res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// ── Update category (ADMIN) ───────────────────────────────────────────────────
export const updateCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { categoryName, maxLoanDays, finePerDay } = req.body;

    const data = {};
    if (categoryName !== undefined) data.categoryName = categoryName;
    if (maxLoanDays !== undefined) data.maxLoanDays = parseInt(maxLoanDays);
    if (finePerDay !== undefined) data.finePerDay = parseFloat(finePerDay);

    const updated = await prisma.category.update({
      where: { categoryId: id },
      data,
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ── Delete category (ADMIN, only if no items) ─────────────────────────────────
export const deleteCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const itemCount = await prisma.item.count({ where: { categoryId: id } });
    if (itemCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: ${itemCount} item(s) are assigned to it.`,
      });
    }

    await prisma.category.delete({ where: { categoryId: id } });
    return res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
