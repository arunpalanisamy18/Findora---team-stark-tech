import { Router, Request, Response, NextFunction } from 'express';
import { Item, ITEM_CATEGORIES, ITEM_TYPES } from '../models/Item.js';
import { findMatchesForItem } from '../services/matching.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';
import { audit } from '../services/audit.js';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const itemsRouter = Router();

// GET /api/items - list items with search and filters
itemsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, category, type, status, limit = '50', page = '1' } = req.query;

    const query: Record<string, any> = {};

    // Filter by type (lost / found)
    if (type && typeof type === 'string' && ITEM_TYPES.includes(type as any)) {
      query.type = type;
    }

    // Filter by category
    if (category && typeof category === 'string' && ITEM_CATEGORIES.includes(category as any)) {
      query.category = category;
    }

    // Filter by status
    if (status && typeof status === 'string') {
      query.status = status;
    }

    // Keyword search over title, description, or location (safely escaped)
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const sanitized = escapeRegex(search.trim());
      query.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
        { location: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Item.find(query).select('-contactEmail -contactPhone -identifyingMarks').sort({ date: -1, createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Item.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: items,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/my - retrieve items reported by current user
itemsRouter.get('/my', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await Item.find({ contactEmail: req.authUser!.email.toLowerCase() })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id - retrieve single item
itemsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id).select('-contactEmail -contactPhone -identifyingMarks').lean();

    if (!item) {
      throw new AppError(`Item with ID "${id}" was not found`, 404);
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/items - validate and create lost or found report
itemsRouter.post('/', requireAuth, requireVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      type,
      title,
      category,
      description,
      location,
      locationId,
      date,
      contactName,
      contactEmail,
      contactPhone,
      identifyingMarks,
      imageUrl,
    } = req.body;

    // Explicit validation checks
    const errors: Record<string, string> = {};

    if (!type || !ITEM_TYPES.includes(type)) {
      errors.type = `Type must be either "lost" or "found"`;
    }
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    }
    if (!category || !ITEM_CATEGORIES.includes(category)) {
      errors.category = `Category must be one of: ${ITEM_CATEGORIES.join(', ')}`;
    }
    if (!description || typeof description !== 'string' || description.trim().length < 5) {
      errors.description = 'Description must be at least 5 characters long';
    }
    if (!location || typeof location !== 'string' || location.trim().length < 2) {
      errors.location = 'Location must be at least 2 characters long';
    }
    if (!contactName || typeof contactName !== 'string' || contactName.trim().length < 2) {
      errors.contactName = 'Contact name must be at least 2 characters long';
    }
    if (!contactEmail || typeof contactEmail !== 'string' || !/^\S+@\S+\.\S+$/.test(contactEmail.trim())) {
      errors.contactEmail = 'Please provide a valid contact email address';
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed. Please correct the highlighted errors.',
        details: errors,
      });
      return;
    }

    const newItem = new Item({
      type,
      title: title.trim(),
      category,
      description: description.trim(),
      location: location.trim(),
      locationId: locationId || undefined,
      date: date ? new Date(date) : new Date(),
      status: 'open',
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      contactPhone: contactPhone ? contactPhone.trim() : undefined,
      identifyingMarks: identifyingMarks ? identifyingMarks.trim() : undefined,
      imageUrl: imageUrl ? imageUrl.trim() : undefined,
    });

    const saved = await newItem.save();
    await audit('item.reported','item',String(saved._id),req,{type:saved.type});

    res.status(201).json({
      success: true,
      message: `${type === 'lost' ? 'Lost' : 'Found'} item reported successfully`,
      data: { _id:saved._id, type:saved.type, title:saved.title, category:saved.category, description:saved.description, location:saved.location, date:saved.date, status:saved.status, imageUrl:saved.imageUrl, createdAt:saved.createdAt, updatedAt:saved.updatedAt },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id/matches - explainable candidate matches
itemsRouter.get('/:id/matches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { threshold, limit } = req.query;

    const sourceItem = await Item.findById(id);
    if (!sourceItem) {
      throw new AppError(`Item with ID "${id}" was not found`, 404);
    }

    const minScore = threshold ? parseInt(threshold as string, 10) : 25;
    const maxResults = limit ? parseInt(limit as string, 10) : 10;

    const matches = await findMatchesForItem(sourceItem, minScore, maxResults);

    res.json({
      success: true,
      data: {
        sourceItem: {
          _id: sourceItem._id,
          title: sourceItem.title,
          type: sourceItem.type,
          category: sourceItem.category,
          location: sourceItem.location,
          date: sourceItem.date,
        },
        targetType: sourceItem.type === 'lost' ? 'found' : 'lost',
        totalMatches: matches.length,
        matches,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/items/:id/status - allow item owner or administrator to update status
itemsRouter.patch('/:id/status', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['open', 'recovered', 'closed'].includes(status)) {
      throw new AppError('Status must be open, recovered, or closed', 400);
    }

    const item = await Item.findById(id);
    if (!item) {
      throw new AppError('Item not found', 404);
    }

    const isOwner = item.contactEmail.toLowerCase() === req.authUser!.email.toLowerCase();
    const isAdmin = req.authUser!.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new AppError('You are not authorized to update this item', 403);
    }

    item.status = status;
    await item.save();
    await audit('item.status_updated', 'item', String(item._id), req, { newStatus: status });

    res.json({
      success: true,
      message: `Item status updated to ${status}`,
      data: item,
    });
  } catch (err) {
    next(err);
  }
});

