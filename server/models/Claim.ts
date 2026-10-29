import mongoose, { Schema, Document, Model } from 'mongoose';

export const CLAIM_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export interface IClaim extends Document {
  itemId: mongoose.Types.ObjectId;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  proofDescription: string;
  proofImageUrl?: string;
  identifyingDetails?: string;
  status: ClaimStatus;
  adminNotes?: string;
  reviewedAt?: Date;
  proposedHandoverLocation?: string;
  confirmedHandoverLocation?: string;
  handedOverAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const claimSchema = new Schema<IClaim>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Associated item ID is required'],
      index: true,
    },
    claimantName: {
      type: String,
      required: [true, 'Claimant name is required'],
      trim: true,
      minlength: [2, 'Claimant name must be at least 2 characters long'],
      maxlength: [100, 'Claimant name cannot exceed 100 characters'],
    },
    claimantEmail: {
      type: String,
      required: [true, 'Claimant email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    claimantPhone: {
      type: String,
      required: [true, 'Claimant phone number is required'],
      trim: true,
      minlength: [5, 'Phone number must be at least 5 characters long'],
      maxlength: [30, 'Phone number cannot exceed 30 characters'],
    },
    proofDescription: {
      type: String,
      required: [true, 'Ownership verification and proof description is required'],
      trim: true,
      minlength: [10, 'Proof description must be at least 10 characters long'],
      maxlength: [3000, 'Proof description cannot exceed 3000 characters'],
    },
    proofImageUrl: {
      type: String,
      trim: true,
      maxlength: [600000, 'Image data exceeds maximum allowed size'],
    },
    identifyingDetails: {
      type: String,
      trim: true,
      maxlength: [1000, 'Identifying details cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: CLAIM_STATUSES,
        message: `Claim status must be one of: ${CLAIM_STATUSES.join(', ')}`,
      },
      default: 'pending',
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
    },
    reviewedAt: { type: Date },
    proposedHandoverLocation: { type: String, trim: true, maxlength: 250 },
    confirmedHandoverLocation: { type: String, trim: true, maxlength: 250 },
    handedOverAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const Claim: Model<IClaim> = mongoose.models.Claim || mongoose.model<IClaim>('Claim', claimSchema);

