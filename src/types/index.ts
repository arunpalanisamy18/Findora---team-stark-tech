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

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  electronics: 'Electronics',
  wallets_cards: 'Wallets & IDs',
  keys: 'Keys',
  clothing: 'Clothing',
  bags: 'Bags & Backpacks',
  documents: 'Documents & Books',
  jewellery: 'Jewellery & Watches',
  accessories: 'Accessories & Bottles',
  other: 'Other / Miscellaneous',
};

export const ITEM_TYPES = ['lost', 'found'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const ITEM_STATUSES = ['open', 'matched', 'claimed', 'recovered', 'closed'] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export interface Item {
  _id: string;
  type: ItemType;
  title: string;
  category: ItemCategory;
  description: string;
  location: string;
  date: string;
  status: ItemStatus;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  identifyingMarks?: string;
  imageUrl?: string;
  storageLocation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemFilters {
  search?: string;
  category?: ItemCategory | '';
  type?: ItemType | '';
  status?: ItemStatus | '';
  page?: number;
  limit?: number;
}

export interface ItemsListResponse {
  success: boolean;
  data: Item[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ScoreDimension {
  score: number;
  max: number;
  reason: string;
}

export interface MatchResult {
  candidate: Item;
  totalScore: number;
  confidence: 'high' | 'medium' | 'low';
  breakdown: {
    category: ScoreDimension;
    title: ScoreDimension;
    description: ScoreDimension;
    location: ScoreDimension;
    date: ScoreDimension;
  };
  summary: string;
}

export interface MatchesData {
  sourceItem: {
    _id: string;
    title: string;
    type: ItemType;
    category: ItemCategory;
    location: string;
    date: string;
  };
  targetType: ItemType;
  totalMatches: number;
  matches: MatchResult[];
}

export const CLAIM_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export interface Claim {
  _id: string;
  itemId: string | Item;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  proofDescription: string;
  proofImageUrl?: string;
  identifyingDetails?: string;
  proposedHandoverLocation?: string;
  confirmedHandoverLocation?: string;
  handedOverAt?: string;
  status: ClaimStatus;
  adminNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemInput {
  type: ItemType;
  title: string;
  category: ItemCategory;
  description: string;
  location: string;
  locationId?: string;
  date?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  identifyingMarks?: string;
  imageUrl?: string;
  storageLocation?: string;
}

export interface CreateClaimInput {
  itemId: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  proofDescription: string;
  proofImageUrl?: string;
  identifyingDetails?: string;
  proposedHandoverLocation?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  phone?: string;
}

export interface LocationItem {
  _id: string;
  name: string;
  type: string;
  address?: string;
  parentId?: string;
  active: boolean;
}

export interface ReviewClaimInput {
  status: 'approved' | 'rejected';
  adminNotes?: string;
}

export interface AdminStats {
  totalItems: number;
  lostItems: number;
  foundItems: number;
  openItems: number;
  claimedItems: number;
  recoveredItems: number;
  closedItems: number;
  recoveryRate: number;
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  handedOverClaims: number;
  categories: { category: ItemCategory; count: number }[];
  hotspots: { location: string; count: number }[];
}

export interface AuditLogEntry {
  _id: string;
  actorId?: { _id: string; name: string; email: string; role: string };
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ip?: string;
  createdAt: string;
}

export interface AdminUpdateItemInput {
  status?: ItemStatus;
  storageLocation?: string;
  location?: string;
  title?: string;
  description?: string;
}

export interface HealthStatus {
  success: boolean;
  status: 'healthy' | 'degraded';
  service: string;
  timestamp: string;
  uptime: number;
  database: {
    provider: string;
    connected: boolean;
    state: string;
    name: string | null;
    host: string | null;
  };
}

