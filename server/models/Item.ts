import mongoose, { Schema, Document, Model } from 'mongoose';

export const ITEM_CATEGORIES = [
  'electronics',
  'wallets_cards',
  'keys',
  'clothing',
  'bags',
  'documents',
  'jewellery',
  'accessories',
  'other',
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const ITEM_TYPES = ['lost', 'found'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const ITEM_STATUSES = ['open', 'matched', 'claimed', 'recovered', 'closed'] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export interface IItem extends Document {
  type: ItemType;
  title: string;
  category: ItemCategory;
  description: string;
  location: string;
  locationId?: mongoose.Types.ObjectId;
  date: Date;
  status: ItemStatus;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  identifyingMarks?: string;
  imageUrl?: string;
  storageLocation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>(
  {
    type: {
      type: String,
      required: [true, 'Item type (lost or found) is required'],
      enum: {
        values: ITEM_TYPES,
        message: 'Type must be either "lost" or "found"',
      },
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Item title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Item category is required'],
      enum: {
        values: ITEM_CATEGORIES,
        message: `Category must be one of: ${ITEM_CATEGORIES.join(', ')}`,
      },
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      minlength: [2, 'Location must be at least 2 characters long'],
      maxlength: [150, 'Location cannot exceed 150 characters'],
      index: true,
    },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', index: true },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ITEM_STATUSES,
        message: `Status must be one of: ${ITEM_STATUSES.join(', ')}`,
      },
      default: 'open',
      index: true,
    },
    contactName: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      minlength: [2, 'Contact name must be at least 2 characters long'],
      maxlength: [100, 'Contact name cannot exceed 100 characters'],
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    contactPhone: {
      type: String,
      trim: true,
      maxlength: [30, 'Phone number cannot exceed 30 characters'],
    },
    identifyingMarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Identifying marks cannot exceed 500 characters'],
    },
    imageUrl: {
      type: String,
      trim: true,
      maxlength: [600000, 'Image data exceeds maximum allowed size'],
    },
    storageLocation: {
      type: String,
      trim: true,
      maxlength: [150, 'Storage location cannot exceed 150 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search queries across title, description, and location
itemSchema.index({ title: 'text', description: 'text', location: 'text' });

export const Item: Model<IItem> = mongoose.models.Item || mongoose.model<IItem>('Item', itemSchema);

