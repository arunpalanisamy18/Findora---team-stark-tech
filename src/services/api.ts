import type {
  Item,
  ItemFilters,
  ItemsListResponse,
  MatchesData,
  Claim,
  ClaimStatus,
  CreateItemInput,
  CreateClaimInput,
  ReviewClaimInput,
  HealthStatus,
  AuthUser,
  LocationItem,
  AdminStats,
  AuditLogEntry,
  AdminUpdateItemInput,
} from '../types/index.js';

function getApiBase(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) {
    return '/api';
  }
  const trimmed = envUrl.replace(/\/+$/, '');
  if (!trimmed.endsWith('/api') && !trimmed.includes('/api/')) {
    return `${trimmed}/api`;
  }
  return trimmed;
}

const API_BASE = getApiBase();

const TOKEN_KEY = 'findora_auth_token';
const USER_KEY = 'findora_auth_user';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore localStorage access failures
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // Ignore
  }
}

export function clearAuth(): void {
  setAuthToken(null);
  setStoredUser(null);
}

export class ApiError extends Error {
  statusCode: number;
  details?: Record<string, string>;

  constructor(message: string, statusCode: number, details?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, data?.details);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or client connection failure
    throw new ApiError(
      `Unable to reach the server at ${url}. Please verify that the backend is running.`,
      0
    );
  }
}

/** Check health status of API and database */
export async function getHealth(): Promise<HealthStatus> {
  return request<HealthStatus>('/health');
}

/** User registration */
export async function register(
  name: string,
  email: string,
  password: string,
  phone?: string
): Promise<{ message: string; devOtp?: string; data: { id: string; email: string; emailVerified: boolean } }> {
  return request<{ success: boolean; message: string; devOtp?: string; data: { id: string; email: string; emailVerified: boolean } }>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    }
  );
}

/** Email verification */
export async function verifyEmail(email: string, code: string): Promise<{ message: string }> {
  return request<{ success: boolean; message: string }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

/** Request password reset code */
export async function requestPasswordReset(email: string): Promise<{ message: string; devOtp?: string }> {
  return request<{ success: boolean; message: string; devOtp?: string }>('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** Confirm password reset with code and new password */
export async function confirmPasswordReset(
  email: string,
  code: string,
  password: string
): Promise<{ message: string }> {
  return request<{ success: boolean; message: string }>('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, code, password }),
  });
}

/** User / Admin Login */
export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: AuthUser }> {
  const res = await request<{ success: boolean; data: { token: string; user: AuthUser } }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
  );
  setAuthToken(res.data.token);
  setStoredUser(res.data.user);
  return res.data;
}

/** Fetch currently authenticated user profile */
export async function getMe(): Promise<AuthUser> {
  const res = await request<{ success: boolean; data: AuthUser }>('/auth/me');
  setStoredUser(res.data);
  return res.data;
}

/** Logout */
export function logout(): void {
  clearAuth();
}

/** Fetch items with optional search, category, type, status, and pagination filters */
export async function getItems(filters: ItemFilters = {}): Promise<ItemsListResponse> {
  const params = new URLSearchParams();

  if (filters.search?.trim()) params.append('search', filters.search.trim());
  if (filters.category) params.append('category', filters.category);
  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const queryString = params.toString();
  const endpoint = `/items${queryString ? `?${queryString}` : ''}`;
  return request<ItemsListResponse>(endpoint);
}

/** Retrieve full details of a single item */
export async function getItem(id: string): Promise<Item> {
  const res = await request<{ success: boolean; data: Item }>(`/items/${id}`);
  return res.data;
}

/** Create a new lost or found item report */
export async function createItem(input: CreateItemInput): Promise<Item> {
  const res = await request<{ success: boolean; message: string; data: Item }>('/items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

/** Fetch algorithmic match recommendations for an item */
export async function getItemMatches(id: string): Promise<MatchesData> {
  const res = await request<{ success: boolean; data: MatchesData }>(`/items/${id}/matches`);
  return res.data;
}

/** Submit an ownership verification claim */
export async function submitClaim(input: CreateClaimInput): Promise<Claim> {
  const res = await request<{ success: boolean; message: string; data: Claim }>('/claims', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

/** List claims for demonstration admin review */
export async function getAdminClaims(status?: ClaimStatus): Promise<Claim[]> {
  const endpoint = status ? `/admin/claims?status=${status}` : '/admin/claims';
  const res = await request<{ success: boolean; count: number; data: Claim[] }>(endpoint);
  return res.data;
}

/** Review (approve or reject) a claim in demonstration admin workflow */
export async function reviewClaim(
  id: string,
  input: ReviewClaimInput
): Promise<{ claim: Claim; itemStatus: string }> {
  const res = await request<{
    success: boolean;
    message: string;
    data: { claim: Claim; itemStatus: string };
  }>(`/admin/claims/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.data;
}

/** Confirm physical item handover (administrator only; marks item recovered) */
export async function confirmHandover(
  claimId: string,
  confirmedHandoverLocation: string
): Promise<{ claimId: string; itemStatus: string; confirmedHandoverLocation: string; handedOverAt: string }> {
  const res = await request<{
    success: boolean;
    message: string;
    data: { claimId: string; itemStatus: string; confirmedHandoverLocation: string; handedOverAt: string };
  }>(`/admin/claims/${claimId}/handover`, {
    method: 'POST',
    body: JSON.stringify({ confirmedHandoverLocation }),
  });
  return res.data;
}

/** Retrieve active location catalogue */
export async function getLocations(): Promise<LocationItem[]> {
  const res = await request<{ success: boolean; data: LocationItem[] }>('/locations');
  return res.data;
}

/** Create a new campus location (Staff / Admin only) */
export async function createLocation(input: {
  name: string;
  type: string;
  address?: string;
}): Promise<LocationItem> {
  const res = await request<{ success: boolean; data: LocationItem }>('/locations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

/** Update campus location (Staff / Admin only) */
export async function updateLocation(
  id: string,
  input: { name?: string; type?: string; address?: string; active?: boolean }
): Promise<LocationItem> {
  const res = await request<{ success: boolean; data: LocationItem }>(`/locations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.data;
}

/** Retrieve claims submitted by currently authenticated user */
export async function getMyClaims(): Promise<Claim[]> {
  const res = await request<{ success: boolean; count: number; data: Claim[] }>('/claims/my');
  return res.data;
}

/** Retrieve items reported by currently authenticated user */
export async function getMyItems(): Promise<Item[]> {
  const res = await request<{ success: boolean; count: number; data: Item[] }>('/items/my');
  return res.data;
}

/** Update status of an item reported by user (e.g. self-resolved to recovered or closed) */
export async function updateMyItemStatus(id: string, status: 'open' | 'recovered' | 'closed'): Promise<Item> {
  const res = await request<{ success: boolean; message: string; data: Item }>(`/items/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.data;
}

/** Administrator: List unredacted inventory with optional filters */
export async function getAdminItems(filters?: {
  search?: string;
  type?: string;
  category?: string;
  status?: string;
}): Promise<Item[]> {
  const params = new URLSearchParams();
  if (filters?.search?.trim()) params.append('search', filters.search.trim());
  if (filters?.type) params.append('type', filters.type);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.status) params.append('status', filters.status);
  const q = params.toString();
  const res = await request<{ success: boolean; count: number; data: Item[] }>(
    `/admin/items${q ? `?${q}` : ''}`
  );
  return res.data;
}

/** Administrator: Update item details or storage assignment */
export async function updateAdminItem(id: string, input: AdminUpdateItemInput): Promise<Item> {
  const res = await request<{ success: boolean; message: string; data: Item }>(`/admin/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.data;
}

/** Administrator: Delete or purge an item record */
export async function deleteAdminItem(id: string): Promise<void> {
  await request<{ success: boolean; message: string }>(`/admin/items/${id}`, {
    method: 'DELETE',
  });
}

/** Administrator: Retrieve system analytics and metric breakdowns */
export async function getAdminStats(): Promise<AdminStats> {
  const res = await request<{ success: boolean; data: AdminStats }>('/admin/stats');
  return res.data;
}

/** Administrator: Retrieve security audit logs */
export async function getAdminAuditLogs(): Promise<AuditLogEntry[]> {
  const res = await request<{ success: boolean; count: number; data: AuditLogEntry[] }>('/admin/audit-logs');
  return res.data;
}

/** Administrator: Get CSV export download URL with authorization */
export function getExportUrl(type: 'items' | 'claims'): string {
  const token = getAuthToken();
  const query = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${API_BASE}/admin/export/${type}${query}`;
}

/** Client-side image compression helper to prepare a clean data URL */
export function compressImageFile(file: File, maxDimension: number = 800, quality: number = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context unavailable'));
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

