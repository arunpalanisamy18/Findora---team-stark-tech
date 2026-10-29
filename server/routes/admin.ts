import { Router, Request, Response, NextFunction } from 'express';
import { Claim, CLAIM_STATUSES } from '../models/Claim.js';
import { Item, ITEM_CATEGORIES, ITEM_STATUSES, ITEM_TYPES } from '../models/Item.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireAdmin } from '../middleware/auth.js';
import { audit, Audit } from '../services/audit.js';

export const adminRouter = Router();

// All administrative operations require a verified administrator session.
adminRouter.use(requireAdmin);

// GET /api/admin/claims - list claims for review (filter by status optional)
adminRouter.get('/claims', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const filter: Record<string, any> = {};

    if (status && typeof status === 'string' && CLAIM_STATUSES.includes(status as any)) {
      filter.status = status;
    }

    const claims = await Claim.find(filter)
      .populate('itemId', 'title type category location date status imageUrl storageLocation')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: claims.length,
      data: claims,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/claims/:id - approve or reject a claim with validation
adminRouter.patch('/claims/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      throw new AppError('Status must be explicitly updated to either "approved" or "rejected"', 400);
    }

    const claim = await Claim.findById(id);
    if (!claim) {
      throw new AppError(`Claim with ID "${id}" was not found`, 404);
    }

    if (claim.status === status) {
      throw new AppError(`Claim is already in "${status}" state`, 400);
    }

    if (claim.status !== 'pending') throw new AppError('Only pending claims can be reviewed', 409);
    claim.status = status;
    if (adminNotes !== undefined) {
      claim.adminNotes = String(adminNotes).trim();
    }
    claim.reviewedAt = new Date();
    await claim.save();

    // Update associated item status based on resolution
    const item = await Item.findById(claim.itemId);
    if (item) {
      if (status === 'approved') {
        // Approval authorizes handover; recovery is recorded only after explicit handover confirmation.
        item.status = 'claimed';
        await item.save();
      } else if (status === 'rejected') {
        // If rejected, check if there are other pending claims
        const remainingPendingClaims = await Claim.countDocuments({
          itemId: item._id,
          status: 'pending',
          _id: { $ne: claim._id },
        });

        if (remainingPendingClaims === 0 && item.status === 'claimed') {
          // Revert back to open since no pending claims remain
          item.status = 'open';
          await item.save();
        }
      }
    }

    await audit(`claim.${status}`,'claim',String(claim._id),req);
    res.json({
      success: true,
      message: `Claim successfully ${status}`, 
      data: {
        claim,
        itemStatus: item ? item.status : null,
      },
    });
  } catch (err) {
    next(err);
  }
});



// Confirm physical handover only after claim approval; this is the only transition to recovered.
adminRouter.post('/claims/:id/handover', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const location = typeof req.body.confirmedHandoverLocation === 'string' ? req.body.confirmedHandoverLocation.trim() : '';
    if (location.length < 2 || location.length > 250) throw new AppError('A confirmed handover location is required', 400);
    const claim = await Claim.findById(req.params.id);
    if (!claim) throw new AppError('Claim not found', 404);
    if (claim.status !== 'approved' || claim.handedOverAt) throw new AppError('Only approved claims without a recorded handover can be completed', 409);
    const item = await Item.findById(claim.itemId);
    if (!item || item.status === 'recovered' || item.status === 'closed') throw new AppError('Item cannot be handed over in its current state', 409);
    claim.confirmedHandoverLocation = location; claim.handedOverAt = new Date(); await claim.save();
    item.status = 'recovered'; await item.save();
    await audit('claim.handover_confirmed','claim',String(claim._id),req,{location});
    res.json({success:true,message:'Handover recorded and item marked recovered',data:{claimId:claim.id,itemStatus:item.status,confirmedHandoverLocation:location,handedOverAt:claim.handedOverAt}});
  } catch (err) { next(err); }
});

// GET /api/admin/items - unredacted campus inventory management
adminRouter.get('/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, type, category, status } = req.query;
    const filter: Record<string, any> = {};

    if (type && typeof type === 'string' && ITEM_TYPES.includes(type as any)) {
      filter.type = type;
    }
    if (category && typeof category === 'string' && ITEM_CATEGORIES.includes(category as any)) {
      filter.category = category;
    }
    if (status && typeof status === 'string' && ITEM_STATUSES.includes(status as any)) {
      filter.status = status;
    }
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
        { location: { $regex: sanitized, $options: 'i' } },
        { contactEmail: { $regex: sanitized, $options: 'i' } },
        { contactName: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const items = await Item.find(filter).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/items/:id - update item status or storage details
adminRouter.patch('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, storageLocation, location, title, description } = req.body;

    const item = await Item.findById(id);
    if (!item) {
      throw new AppError('Item not found', 404);
    }

    if (status !== undefined) {
      if (!ITEM_STATUSES.includes(status)) {
        throw new AppError(`Invalid status. Must be one of: ${ITEM_STATUSES.join(', ')}`, 400);
      }
      item.status = status;
    }
    if (storageLocation !== undefined) {
      item.storageLocation = String(storageLocation).trim();
    }
    if (location !== undefined) {
      item.location = String(location).trim();
    }
    if (title !== undefined && String(title).trim().length >= 3) {
      item.title = String(title).trim();
    }
    if (description !== undefined && String(description).trim().length >= 5) {
      item.description = String(description).trim();
    }

    await item.save();
    await audit('admin.item_updated', 'item', String(item._id), req, { status: item.status, storageLocation: item.storageLocation });

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: item,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/items/:id - archive or delete item
adminRouter.delete('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await Item.findByIdAndDelete(id);
    if (!item) {
      throw new AppError('Item not found', 404);
    }

    await audit('admin.item_deleted', 'item', String(id), req, { title: item.title });

    res.json({
      success: true,
      message: 'Item record removed',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/stats - system-wide operational analytics
adminRouter.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalItems,
      lostItems,
      foundItems,
      openItems,
      claimedItems,
      recoveredItems,
      closedItems,
      totalClaims,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      handedOverClaims,
      categoryCounts,
      locationCounts,
    ] = await Promise.all([
      Item.countDocuments(),
      Item.countDocuments({ type: 'lost' }),
      Item.countDocuments({ type: 'found' }),
      Item.countDocuments({ status: 'open' }),
      Item.countDocuments({ status: 'claimed' }),
      Item.countDocuments({ status: 'recovered' }),
      Item.countDocuments({ status: 'closed' }),
      Claim.countDocuments(),
      Claim.countDocuments({ status: 'pending' }),
      Claim.countDocuments({ status: 'approved' }),
      Claim.countDocuments({ status: 'rejected' }),
      Claim.countDocuments({ handedOverAt: { $exists: true, $ne: null } }),
      Item.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Item.aggregate([
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const recoveryRate = totalItems > 0 ? Math.round((recoveredItems / totalItems) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalItems,
        lostItems,
        foundItems,
        openItems,
        claimedItems,
        recoveredItems,
        closedItems,
        recoveryRate,
        totalClaims,
        pendingClaims,
        approvedClaims,
        rejectedClaims,
        handedOverClaims,
        categories: categoryCounts.map((c) => ({ category: c._id, count: c.count })),
        hotspots: locationCounts.map((l) => ({ location: l._id, count: l.count })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/audit-logs - live security audit stream
adminRouter.get('/audit-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await Audit.find()
      .populate('actorId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/export/items - export CSV format
adminRouter.get('/export/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 }).lean();
    let csv = 'ID,Type,Title,Category,Status,Location,StorageLocation,Date,ReporterName,ReporterEmail,ReporterPhone,CreatedAt\n';

    for (const item of items) {
      const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      csv += [
        escape(item._id),
        escape(item.type),
        escape(item.title),
        escape(item.category),
        escape(item.status),
        escape(item.location),
        escape(item.storageLocation || 'Unassigned'),
        escape(item.date ? new Date(item.date).toISOString() : ''),
        escape(item.contactName),
        escape(item.contactEmail),
        escape(item.contactPhone || ''),
        escape(item.createdAt ? new Date(item.createdAt).toISOString() : ''),
      ].join(',') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="findora-inventory.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/export/claims - export claims CSV format
adminRouter.get('/export/claims', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const claims = await Claim.find().populate('itemId', 'title').sort({ createdAt: -1 }).lean();
    let csv = 'ID,AssociatedItem,ClaimantName,ClaimantEmail,ClaimantPhone,Status,ProofDescription,ConfirmedHandoverLocation,HandedOverAt,CreatedAt\n';

    for (const claim of claims) {
      const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      const itemTitle = (claim.itemId as any)?.title || 'Unknown Item';
      csv += [
        escape(claim._id),
        escape(itemTitle),
        escape(claim.claimantName),
        escape(claim.claimantEmail),
        escape(claim.claimantPhone),
        escape(claim.status),
        escape(claim.proofDescription),
        escape(claim.confirmedHandoverLocation || ''),
        escape(claim.handedOverAt ? new Date(claim.handedOverAt).toISOString() : ''),
        escape(claim.createdAt ? new Date(claim.createdAt).toISOString() : ''),
      ].join(',') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="findora-claims.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});
