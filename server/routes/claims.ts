import { Router, Request, Response, NextFunction } from 'express';
import { Claim } from '../models/Claim.js';
import { Item } from '../models/Item.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';
import { audit } from '../services/audit.js';

export const claimsRouter = Router();

// POST /api/claims - submit a claim with ownership-verification details
claimsRouter.post('/', requireAuth, requireVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      itemId,
      claimantName,
      claimantEmail,
      claimantPhone,
      proofDescription,
      proofImageUrl,
      identifyingDetails,
      proposedHandoverLocation,
    } = req.body;

    const errors: Record<string, string> = {};

    if (!itemId) {
      errors.itemId = 'Item ID is required';
    }
    if (!claimantName || typeof claimantName !== 'string' || claimantName.trim().length < 2) {
      errors.claimantName = 'Claimant name must be at least 2 characters long';
    }
    if (!claimantEmail || typeof claimantEmail !== 'string' || !/^\S+@\S+\.\S+$/.test(claimantEmail.trim())) {
      errors.claimantEmail = 'Please provide a valid email address';
    }
    if (!claimantPhone || typeof claimantPhone !== 'string' || claimantPhone.trim().length < 5) {
      errors.claimantPhone = 'Phone number must be at least 5 digits/characters';
    }
    if (!proofDescription || typeof proofDescription !== 'string' || proofDescription.trim().length < 10) {
      errors.proofDescription = 'Proof description must be at least 10 characters explaining ownership details';
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed. Please correct the highlighted errors.',
        details: errors,
      });
      return;
    }

    // Verify item existence and eligibility
    const item = await Item.findById(itemId);
    if (!item) {
      throw new AppError(`Item with ID "${itemId}" does not exist`, 404);
    }

    if (item.status === 'recovered') {
      throw new AppError('This item has already been verified and recovered by its owner', 400);
    }

    if (item.status === 'closed') {
      throw new AppError('This item listing is closed and cannot accept new claims', 400);
    }

    if (String(claimantEmail).trim().toLowerCase() !== req.authUser!.email.toLowerCase()) throw new AppError('Claim email must match your signed-in account', 403);
    if (proposedHandoverLocation !== undefined && (typeof proposedHandoverLocation !== 'string' || proposedHandoverLocation.trim().length > 250)) throw new AppError('Invalid proposed handover location',400);

    // Create claim with initial 'pending' status
    const newClaim = new Claim({
      itemId: item._id,
      claimantName: claimantName.trim(),
      claimantEmail: claimantEmail.trim().toLowerCase(),
      claimantPhone: claimantPhone.trim(),
      proofDescription: proofDescription.trim(),
      proofImageUrl: proofImageUrl ? String(proofImageUrl).trim() : undefined,
      identifyingDetails: identifyingDetails ? identifyingDetails.trim() : undefined,
      proposedHandoverLocation: proposedHandoverLocation ? proposedHandoverLocation.trim() : undefined,
      status: 'pending',
    });

    const savedClaim = await newClaim.save();
    await audit('claim.submitted','claim',String(savedClaim._id),req);

    // Mark item status as 'claimed' (pending review) - NOT 'recovered'
    if (item.status === 'open') {
      item.status = 'claimed';
      await item.save();
    }

    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully and is pending administrator verification.',
      data: { _id:savedClaim._id, itemId:savedClaim.itemId, status:savedClaim.status, createdAt:savedClaim.createdAt },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/claims/my - retrieve claims submitted by current user
claimsRouter.get('/my', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const claims = await Claim.find({ claimantEmail: req.authUser!.email.toLowerCase() })
      .populate('itemId', 'title type category location date status imageUrl')
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

