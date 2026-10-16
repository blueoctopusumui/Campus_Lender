// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Items Controller

import prisma from '../prismaClient.js';

const DEFAULT_LIMIT = 20;

// ── List items (public, with search/filter/pagination) ───────────────────────
export const listItems = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const { search, status } = req.query;
    const catParam = req.query.categoryId || req.query.category;

    // Build where clause for standard filters
    const where = {};
    if (catParam) {
      const parsedCatId = parseInt(catParam, 10);
      if (!isNaN(parsedCatId) && String(parsedCatId) === String(catParam).trim()) {
        where.categoryId = parsedCatId;
      } else {
        where.category = { categoryName: { contains: String(catParam).trim() } };
      }
    }
    if (status) where.status = status;

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term } },
        { description: { contains: term } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          owner: { select: { userId: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.item.count({ where }),
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── Get item by ID ────────────────────────────────────────────────────────────
export const getItemById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.item.findUnique({
      where: { itemId: id },
      include: {
        category: true,
        owner: { select: { userId: true, fullName: true, email: true } },
        lendingRequests: {
          where: { status: { in: ['PENDING', 'APPROVED'] } },
          select: { requestedFrom: true, requestedTo: true, status: true },
        },
      },
    });

    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    return res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// ── Create item (STAFF or ADMIN) ──────────────────────────────────────────────
export const createItem = async (req, res, next) => {
  try {
    const { title, description, itemCondition, categoryId, finePerDay, maxLoanDays } = req.body;

    if (!title || !categoryId) {
      return res.status(400).json({ success: false, message: 'title and categoryId are required.' });
    }

    const item = await prisma.item.create({
      data: {
        title,
        description,
        itemCondition: itemCondition || 'GOOD',
        status: 'AVAILABLE',
        ownerId: req.user.userId,
        categoryId: parseInt(categoryId),
        finePerDay: finePerDay ? parseFloat(finePerDay) : 5.00,
        maxLoanDays: maxLoanDays ? parseInt(maxLoanDays, 10) : 7,
      },
      include: { category: true },
    });

    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// ── Update item (owner or ADMIN) ──────────────────────────────────────────────
export const updateItem = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.item.findUnique({ where: { itemId: id } });

    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    if (req.user.role !== 'ADMIN' && item.ownerId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied. Not the item owner.' });
    }

    const { title, description, itemCondition, categoryId, status } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (itemCondition !== undefined) data.itemCondition = itemCondition;
    if (categoryId !== undefined) data.categoryId = parseInt(categoryId);
    if (status !== undefined && req.user.role === 'ADMIN') data.status = status;

    const updated = await prisma.item.update({
      where: { itemId: id },
      data,
      include: { category: true },
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ── Delete item (owner or ADMIN, only if AVAILABLE) ───────────────────────────
export const deleteItem = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.item.findUnique({ where: { itemId: id } });

    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    if (req.user.role !== 'ADMIN' && item.ownerId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (item.status !== 'AVAILABLE') {
      return res.status(400).json({ success: false, message: 'Item can only be deleted when status is AVAILABLE.' });
    }

    await prisma.item.delete({ where: { itemId: id } });
    return res.json({ success: true, message: 'Item deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
