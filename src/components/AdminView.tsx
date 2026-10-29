import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  User,
  Mail,
  Phone,
  Lock,
  Tag,
  MapPin,
  Calendar,
  KeyRound,
  PackageCheck,
  X,
  Search,
  Layers,
  BarChart3,
  FileSpreadsheet,
  Shield,
  Download,
  Trash2,
  Edit2,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import type {
  Claim,
  ClaimStatus,
  Item,
  AuthUser,
  AdminStats,
  AuditLogEntry,
  ItemStatus,
  LocationItem,
} from '../types/index.js';
import { CATEGORY_LABELS, ITEM_STATUSES } from '../types/index.js';
import {
  getAdminClaims,
  reviewClaim,
  confirmHandover,
  login,
  getAdminItems,
  updateAdminItem,
  deleteAdminItem,
  getAdminStats,
  getAdminAuditLogs,
  getExportUrl,
  getLocations,
  createLocation,
  updateLocation,
} from '../services/api.js';

interface AdminViewProps {
  onItemUpdated: () => void;
  currentUser: AuthUser | null;
  onLoginSuccess: (user: AuthUser) => void;
}

type AdminTab = 'claims' | 'inventory' | 'locations' | 'analytics' | 'audit' | 'export';

export const AdminView: React.FC<AdminViewProps> = ({
  onItemUpdated,
  currentUser,
  onLoginSuccess,
}) => {
  const [adminTab, setAdminTab] = useState<AdminTab>('claims');

  // CLAIMS STATE
  const [allClaims, setAllClaims] = useState<Claim[]>([]);
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'all'>('pending');
  const [claimSearch, setClaimSearch] = useState('');
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [claimsError, setClaimsError] = useState<string | null>(null);

  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Handover state
  const [handoverModalClaim, setHandoverModalClaim] = useState<Claim | null>(null);
  const [handoverLocationInput, setHandoverLocationInput] = useState('');
  const [handoverSubmitting, setHandoverSubmitting] = useState(false);

  // INVENTORY STATE
  const [inventoryItems, setInventoryItems] = useState<Item[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<string>('');
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState<string>('');
  const [editingStorageId, setEditingStorageId] = useState<string | null>(null);
  const [storageLocationInput, setStorageLocationInput] = useState('');

  // STATS & AUDIT STATE
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // LOCATIONS STATE
  const [locationsList, setLocationsList] = useState<LocationItem[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationType, setNewLocationType] = useState('building');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [creatingLocation, setCreatingLocation] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);

  // Quick Admin Login State for AdminView gate
  const [adminEmail, setAdminEmail] = useState('admin@example.edu');
  const [adminPassword, setAdminPassword] = useState('Admin#Findora2026!');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Close handover modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && handoverModalClaim) {
        setHandoverModalClaim(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handoverModalClaim]);

  // Load claims
  const loadClaims = async () => {
    if (!isAdmin) return;
    setClaimsLoading(true);
    setClaimsError(null);
    try {
      const data = await getAdminClaims();
      setAllClaims(data);
    } catch (err: any) {
      setClaimsError(err.message || 'Failed to load claims from database');
    } finally {
      setClaimsLoading(false);
    }
  };

  // Load inventory
  const loadInventory = async () => {
    if (!isAdmin) return;
    setInventoryLoading(true);
    try {
      const data = await getAdminItems({
        search: inventorySearch,
        type: inventoryTypeFilter,
        status: inventoryStatusFilter,
      });
      setInventoryItems(data);
    } catch (err: any) {
      setClaimsError(err.message || 'Failed to load inventory');
    } finally {
      setInventoryLoading(false);
    }
  };

  // Load analytics
  const loadStats = async () => {
    if (!isAdmin) return;
    setStatsLoading(true);
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch {
      // Ignore
    } finally {
      setStatsLoading(false);
    }
  };

  // Load audit logs
  const loadAuditLogs = async () => {
    if (!isAdmin) return;
    setAuditLoading(true);
    try {
      const data = await getAdminAuditLogs();
      setAuditLogs(data);
    } catch {
      // Ignore
    } finally {
      setAuditLoading(false);
    }
  };

  // Load campus locations
  const loadLocations = async () => {
    if (!isAdmin) return;
    setLocationsLoading(true);
    setLocationsError(null);
    try {
      const data = await getLocations();
      setLocationsList(data);
    } catch (err: any) {
      setLocationsError(err.message || 'Failed to load campus locations');
    } finally {
      setLocationsLoading(false);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationName.trim()) return;
    setCreatingLocation(true);
    setLocationsError(null);
    try {
      const created = await createLocation({
        name: newLocationName.trim(),
        type: newLocationType,
        address: newLocationAddress.trim() || undefined,
      });
      setLocationsList((prev) => [created, ...prev]);
      setNewLocationName('');
      setNewLocationAddress('');
      setLocationSuccessMsg(`Campus location "${created.name}" created successfully!`);
      setTimeout(() => setLocationSuccessMsg(null), 4000);
    } catch (err: any) {
      setLocationsError(err.message || 'Failed to create campus location');
    } finally {
      setCreatingLocation(false);
    }
  };

  const handleToggleLocationActive = async (id: string, currentActive: boolean) => {
    try {
      const updated = await updateLocation(id, { active: !currentActive });
      setLocationsList((prev) => prev.map((loc) => (loc._id === id ? updated : loc)));
    } catch (err: any) {
      setLocationsError(err.message || 'Failed to update location status');
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadClaims();
      loadInventory();
      loadStats();
      loadLocations();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (adminTab === 'inventory') {
      loadInventory();
    } else if (adminTab === 'locations') {
      loadLocations();
    } else if (adminTab === 'analytics') {
      loadStats();
    } else if (adminTab === 'audit') {
      loadAuditLogs();
    }
  }, [adminTab]);

  const pendingCount = allClaims.filter((c) => c.status === 'pending').length;
  const approvedCount = allClaims.filter((c) => c.status === 'approved').length;
  const rejectedCount = allClaims.filter((c) => c.status === 'rejected').length;

  const filteredByStatus =
    statusFilter === 'all'
      ? allClaims
      : allClaims.filter((c) => c.status === statusFilter);

  const displayedClaims = claimSearch.trim()
    ? filteredByStatus.filter((c) => {
        const q = claimSearch.toLowerCase().trim();
        const item = typeof c.itemId === 'object' && c.itemId !== null ? (c.itemId as Item) : null;
        return Boolean(
          (c.claimantName && c.claimantName.toLowerCase().includes(q)) ||
          (c.claimantEmail && c.claimantEmail.toLowerCase().includes(q)) ||
          (c._id && c._id.toLowerCase().includes(q)) ||
          (item && item.title && item.title.toLowerCase().includes(q))
        );
      })
    : filteredByStatus;

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setAdminLoginLoading(true);
    try {
      const res = await login(adminEmail.trim().toLowerCase(), adminPassword);
      if (res.user.role !== 'admin') {
        setAdminLoginError('This account does not have administrator privileges.');
        return;
      }
      onLoginSuccess(res.user);
    } catch (err: any) {
      setAdminLoginError(err.message || 'Admin authentication failed');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleReview = async (claimId: string, action: 'approved' | 'rejected') => {
    setProcessingId(claimId);
    setActionMessage(null);
    setClaimsError(null);

    const notes = adminNotes[claimId] || '';
    try {
      const res = await reviewClaim(claimId, {
        status: action,
        adminNotes: notes,
      });

      setActionMessage(
        action === 'approved'
          ? `Claim approved. Item status is now "${res.itemStatus}". You can now confirm the physical handover below to mark the item recovered.`
          : `Claim rejected. Item status reverted to "${res.itemStatus}".`
      );

      setAllClaims((prev) =>
        prev.map((c) => (c._id === claimId ? { ...c, status: action, adminNotes: notes } : c))
      );
      onItemUpdated();
    } catch (err: any) {
      setClaimsError(err.message || `Failed to ${action} claim`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenHandoverModal = (claim: Claim) => {
    const item = typeof claim.itemId === 'object' && claim.itemId !== null ? (claim.itemId as Item) : null;
    setHandoverModalClaim(claim);
    setHandoverLocationInput(claim.proposedHandoverLocation || item?.location || 'Main Campus Security Desk');
  };

  const handleConfirmHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverModalClaim) return;
    if (!handoverLocationInput.trim() || handoverLocationInput.trim().length < 2) {
      setClaimsError('A confirmed handover location is required.');
      return;
    }

    setHandoverSubmitting(true);
    setClaimsError(null);
    try {
      const res = await confirmHandover(handoverModalClaim._id, handoverLocationInput.trim());
      setActionMessage(`Handover confirmed! Item marked as recovered at "${res.confirmedHandoverLocation}".`);

      setAllClaims((prev) =>
        prev.map((c) =>
          c._id === handoverModalClaim._id
            ? {
                ...c,
                confirmedHandoverLocation: res.confirmedHandoverLocation,
                handedOverAt: res.handedOverAt,
              }
            : c
        )
      );
      setHandoverModalClaim(null);
      onItemUpdated();
      loadInventory();
      loadStats();
    } catch (err: any) {
      setClaimsError(err.message || 'Failed to record handover');
    } finally {
      setHandoverSubmitting(false);
    }
  };

  const handleSaveStorageLocation = async (itemId: string) => {
    try {
      const updated = await updateAdminItem(itemId, { storageLocation: storageLocationInput });
      setInventoryItems((prev) => prev.map((item) => (item._id === itemId ? updated : item)));
      setEditingStorageId(null);
      setStorageLocationInput('');
    } catch (err: any) {
      setClaimsError(err.message || 'Failed to update storage location');
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: ItemStatus) => {
    try {
      const updated = await updateAdminItem(itemId, { status: newStatus });
      setInventoryItems((prev) => prev.map((item) => (item._id === itemId ? updated : item)));
      onItemUpdated();
    } catch (err: any) {
      setClaimsError(err.message || 'Failed to update status');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item record?')) return;
    try {
      await deleteAdminItem(itemId);
      setInventoryItems((prev) => prev.filter((item) => item._id !== itemId));
      onItemUpdated();
    } catch (err: any) {
      setClaimsError(err.message || 'Failed to delete item');
    }
  };

  const [exportingType, setExportingType] = useState<'items' | 'claims' | null>(null);

  const handleDownloadExport = async (type: 'items' | 'claims') => {
    setExportingType(type);
    try {
      const url = getExportUrl(type);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Export failed with HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `findora-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      setActionMessage(`Exported ${type === 'items' ? 'Inventory' : 'Claims'} CSV successfully.`);
    } catch (err: any) {
      setClaimsError(err.message || 'Failed to download CSV export');
    } finally {
      setExportingType(null);
    }
  };

  // If NOT logged in as admin, show Administrator Authentication Gate
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5 transition-colors">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Administrator Access Required</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Sign in with campus staff or admin credentials</p>
          </div>
        </div>

        {adminLoginError && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span>{adminLoginError}</span>
          </div>
        )}

        <form onSubmit={handleAdminSignIn} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="input pl-9 text-xs py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="input pl-9 text-xs py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={adminLoginLoading}
            className="btn btn-primary text-xs w-full py-2.5"
          >
            {adminLoginLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Admin Claims Portal</span>
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-center">
          <span>Seeded admin credentials loaded for local evaluation.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prominent Admin Control Banner */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Campus Security Command Center</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 dark:border-amber-500/30">
                  Staff Portal
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                Logged in as <strong className="text-slate-900 dark:text-white">{currentUser?.email}</strong>. Review confidential claim evidence, inspect photos side-by-side, manage unredacted inventory, and record physical handovers.
              </p>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs self-start md:self-auto shadow-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Pending Claims</span>
              <span className="text-base font-bold text-amber-600 dark:text-amber-400">{pendingCount}</span>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Total Inventory</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-200">{inventoryItems.length}</span>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Recovery Rate</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{stats?.recoveryRate ?? 0}%</span>
            </div>
          </div>
        </div>

        {/* Admin Navigation Modules */}
        <div className="flex items-center gap-1.5 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 overflow-x-auto">
          {[
            { id: 'claims', label: 'Claims & Handover', icon: PackageCheck, badge: pendingCount },
            { id: 'inventory', label: 'Item Inventory', icon: Layers, badge: inventoryItems.length },
            { id: 'locations', label: 'Campus Locations', icon: MapPin, badge: locationsList.length },
            { id: 'analytics', label: 'System Analytics', icon: BarChart3 },
            { id: 'audit', label: 'Security Audit Log', icon: Shield },
            { id: 'export', label: 'Data Export', icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = adminTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setAdminTab(tab.id as AdminTab)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-amber-700 text-white' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Error Alert */}
      {claimsError && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <span>{claimsError}</span>
        </div>
      )}

      {/* TAB 1: CLAIMS & HANDOVER */}
      {adminTab === 'claims' && (
        <div className="space-y-4">
          {/* Filter Tabs, Search & Refresh */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
                Status:
              </span>
              {([
                { id: 'pending', label: 'Pending Review', count: pendingCount },
                { id: 'approved', label: 'Approved', count: approvedCount },
                { id: 'rejected', label: 'Rejected', count: rejectedCount },
                { id: 'all', label: 'All Records', count: allClaims.length },
              ] as const).map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    statusFilter === tab.id
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      statusFilter === tab.id
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter claims by keyword..."
                  value={claimSearch}
                  onChange={(e) => setClaimSearch(e.target.value)}
                  className="input pl-8 pr-7 text-xs py-1.5 w-full"
                />
                {claimSearch && (
                  <button
                    type="button"
                    onClick={() => setClaimSearch('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Clear filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={loadClaims}
                disabled={claimsLoading}
                className="btn btn-outline btn-sm text-xs shrink-0"
                title="Refresh claims list"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${claimsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Loading Skeleton */}
          {claimsLoading && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="card p-5 animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800/80 rounded w-2/3" />
                  <div className="h-20 bg-slate-50 dark:bg-slate-900 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!claimsLoading && displayedClaims.length === 0 && (
            <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <Clock className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No {statusFilter === 'all' ? '' : statusFilter} claims found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {statusFilter === 'pending'
                  ? 'All submitted claims have been processed by administrators, or none have been submitted yet.'
                  : 'Try selecting a different status filter above.'}
              </p>
            </div>
          )}

          {/* Claims List */}
          {!claimsLoading && displayedClaims.length > 0 && (
            <div className="space-y-5">
              {displayedClaims.map((claim) => {
                const item = typeof claim.itemId === 'object' && claim.itemId !== null ? (claim.itemId as Item) : null;
                const isProcessing = processingId === claim._id;

                const statusClass =
                  claim.status === 'approved'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : claim.status === 'rejected'
                    ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';

                return (
                  <div
                    key={claim._id}
                    className="card border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border capitalize ${statusClass}`}
                        >
                          Claim: {claim.status}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Submitted on {new Date(claim.createdAt).toLocaleDateString()}
                        </span>
                        {claim.handedOverAt && (
                          <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                            <PackageCheck className="h-3 w-3" />
                            Handover Confirmed ({new Date(claim.handedOverAt).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500">ID: {claim._id}</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 py-4">
                      {/* Left Column: Target Item & Photo */}
                      <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700/60">
                        <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Associated Item</span>
                          {item && (
                            <span className="capitalize font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px]">
                              Item Status: {item.status}
                            </span>
                          )}
                        </h5>

                        {item ? (
                          <div className="space-y-2">
                            {item.imageUrl && (
                              <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 max-h-40 flex items-center justify-center">
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="h-36 w-full object-cover"
                                />
                              </div>
                            )}

                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{item.title}</h4>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mb-2">
                                <span className="flex items-center gap-1">
                                  <Tag className="h-3 w-3 text-slate-400" />
                                  {CATEGORY_LABELS[item.category] || item.category}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-slate-400" />
                                  {item.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  {item.date || item.createdAt
                                    ? new Date(item.date || item.createdAt).toLocaleDateString()
                                    : 'Recently'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            Associated item record details unavailable
                          </p>
                        )}
                      </div>

                      {/* Right Column: Claimant & Submitted Proof + Proof Photo */}
                      <div className="space-y-3">
                        <div>
                          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                            Claimant Contact
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-1.5 font-medium">
                              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{claim.claimantName}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{claim.claimantEmail}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{claim.claimantPhone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 rounded-lg p-3 text-xs space-y-2">
                          <div className="flex items-center gap-1 font-bold text-amber-950 dark:text-amber-300">
                            <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Submitted Ownership Verification Proof:</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-mono text-[11px] bg-white dark:bg-slate-950 p-2 rounded border border-amber-100 dark:border-amber-950/60">
                            {claim.proofDescription}
                          </p>

                          {/* Proof Photo Attachment */}
                          {claim.proofImageUrl && (
                            <div className="pt-1">
                              <span className="font-semibold text-amber-950 dark:text-amber-300 text-[11px] block mb-1">
                                Attached Proof Document / Photo:
                              </span>
                              <div className="rounded-lg overflow-hidden border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-950 max-h-36 flex items-center">
                                <img
                                  src={claim.proofImageUrl}
                                  alt="Attached proof evidence"
                                  className="h-32 w-auto object-contain rounded"
                                />
                              </div>
                            </div>
                          )}

                          {claim.identifyingDetails && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                              <strong className="text-slate-700 dark:text-slate-300">Serial / Additional Info:</strong> {claim.identifyingDetails}
                            </p>
                          )}
                          {claim.proposedHandoverLocation && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                              <strong className="text-slate-700 dark:text-slate-300">Proposed Handover Location:</strong> {claim.proposedHandoverLocation}
                            </p>
                          )}
                          {claim.confirmedHandoverLocation && (
                            <p className="text-[11px] text-emerald-800 dark:text-emerald-300 pt-1 font-semibold">
                              <strong>Confirmed Handover Location:</strong> {claim.confirmedHandoverLocation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Review Notes and Decision Buttons */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex-1 max-w-lg">
                        {claim.status === 'pending' ? (
                          <input
                            type="text"
                            placeholder="Add inspection or handover notes (optional)..."
                            value={adminNotes[claim._id] ?? (claim.adminNotes || '')}
                            onChange={(e) =>
                              setAdminNotes((prev) => ({ ...prev, [claim._id]: e.target.value }))
                            }
                            className="input text-xs py-1.5"
                          />
                        ) : claim.adminNotes ? (
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            <strong className="text-slate-700 dark:text-slate-300">Admin Note:</strong> {claim.adminNotes}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 justify-end shrink-0">
                        {claim.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReview(claim._id, 'rejected')}
                              disabled={isProcessing}
                              className="btn btn-danger btn-sm text-xs"
                              title="Reject claim and revert item status to open"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReview(claim._id, 'approved')}
                              disabled={isProcessing}
                              className="btn btn-success btn-sm text-xs"
                              title="Verify claim and authorize handover"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Approve Claim</span>
                            </button>
                          </>
                        ) : claim.status === 'approved' && !claim.handedOverAt ? (
                          <button
                            type="button"
                            onClick={() => handleOpenHandoverModal(claim)}
                            className="btn btn-primary btn-sm text-xs"
                            title="Record physical handover and mark item recovered"
                          >
                            <PackageCheck className="h-3.5 w-3.5" />
                            <span>Confirm Handover &amp; Recover</span>
                          </button>
                        ) : (
                          <div className="text-xs text-slate-500 italic">
                            Claim {claim.status} on{' '}
                            {claim.reviewedAt ? new Date(claim.reviewedAt).toLocaleDateString() : 'earlier'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UNREDACTED INVENTORY MANAGEMENT */}
      {adminTab === 'inventory' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search inventory by title, reporter, location..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="input pl-8 text-xs py-1.5"
                />
              </div>

              <select
                value={inventoryTypeFilter}
                onChange={(e) => setInventoryTypeFilter(e.target.value)}
                className="input text-xs py-1.5 w-auto"
              >
                <option value="">All Types</option>
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>

              <select
                value={inventoryStatusFilter}
                onChange={(e) => setInventoryStatusFilter(e.target.value)}
                className="input text-xs py-1.5 w-auto"
              >
                <option value="">All Statuses</option>
                {ITEM_STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>

              <button type="button" onClick={loadInventory} disabled={inventoryLoading} className="btn btn-primary btn-sm text-xs">
                <RefreshCw className={`h-3 w-3 ${inventoryLoading ? 'animate-spin' : ''}`} />
                <span>Filter</span>
              </button>
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong>{inventoryItems.length}</strong> items in database
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Item &amp; Photo</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Campus Location</th>
                    <th className="py-3 px-3">Storage / Locker</th>
                    <th className="py-3 px-3">Reporter Details</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {inventoryItems.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="h-10 w-10 rounded object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block line-clamp-1">{item.title}</span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">ID: {item._id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`uppercase text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.type === 'lost'
                              ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[140px]" title={item.location}>
                        {item.location}
                      </td>

                      <td className="py-3 px-3">
                        {editingStorageId === item._id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={storageLocationInput}
                              onChange={(e) => setStorageLocationInput(e.target.value)}
                              placeholder="e.g. Bin A-4"
                              className="input text-[11px] py-1 px-1.5 w-24"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveStorageLocation(item._id)}
                              className="p-1 rounded bg-emerald-600 text-white"
                              title="Save"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStorageId(null)}
                              className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                              title="Cancel"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStorageId(item._id);
                              setStorageLocationInput(item.storageLocation || '');
                            }}
                            className="text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                          >
                            <span>{item.storageLocation || 'Assign Locker'}</span>
                            <Edit2 className="h-2.5 w-2.5 text-slate-400" />
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        <span className="font-semibold block text-slate-800 dark:text-slate-200">{item.contactName}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.contactEmail}</span>
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateItemStatus(item._id, e.target.value as ItemStatus)}
                          className="input text-[11px] py-0.5 px-2 w-auto font-semibold capitalize"
                        >
                          {ITEM_STATUSES.map((s) => (
                            <option key={s} value={s} className="capitalize">
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item._id)}
                          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded"
                          title="Delete record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CAMPUS LOCATIONS DIRECTORY & MANAGEMENT */}
      {adminTab === 'locations' && (
        <div className="space-y-6">
          <div className="card p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  <span>Campus Locations &amp; Zones Management</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure official campus zones, buildings, and collection points available in student report dropdowns.
                </p>
              </div>

              <button
                type="button"
                onClick={loadLocations}
                disabled={locationsLoading}
                className="btn btn-outline btn-sm text-xs self-start sm:self-auto flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3 w-3 ${locationsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Locations</span>
              </button>
            </div>

            {locationSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{locationSuccessMsg}</span>
              </div>
            )}

            {locationsError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{locationsError}</span>
              </div>
            )}

            {/* Add New Location Form */}
            <form onSubmit={handleCreateLocation} className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Add New Campus Location
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Location / Building Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Complex Lab 3"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    className="input text-xs py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Facility Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newLocationType}
                    onChange={(e) => setNewLocationType(e.target.value)}
                    className="input text-xs py-2 capitalize"
                  >
                    <option value="building">Building / Complex</option>
                    <option value="library">Library</option>
                    <option value="cafeteria">Cafeteria / Dining</option>
                    <option value="park">Outdoor / Grounds / Arena</option>
                    <option value="bus_stand">Transit / Bus Stand</option>
                    <option value="institution">Administration / Security</option>
                    <option value="college">Department / College</option>
                    <option value="other">Other Zone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Address / Zone Detail (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. North Wing, Level 2"
                    value={newLocationAddress}
                    onChange={(e) => setNewLocationAddress(e.target.value)}
                    className="input text-xs py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={creatingLocation || !newLocationName.trim()}
                  className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  {creatingLocation ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Location...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Add Campus Location</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Locations Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Location Name</th>
                    <th className="py-2.5 px-4">Facility Type</th>
                    <th className="py-2.5 px-4">Address / Zone</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {locationsList.map((loc) => (
                    <tr key={loc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {loc.name}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {loc.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">
                        {loc.address || '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            loc.active !== false
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {loc.active !== false ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleLocationActive(loc._id, loc.active !== false)}
                          className="btn btn-outline btn-sm text-[11px] py-1 px-2.5"
                        >
                          {loc.active !== false ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS & HOTSPOTS */}
      {adminTab === 'analytics' && statsLoading && (
        <div className="text-center py-12 text-slate-500 text-xs">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-600" />
          <span>Calculating campus metrics &amp; hotspots...</span>
        </div>
      )}
      {adminTab === 'analytics' && !statsLoading && stats && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block uppercase font-semibold">Total Reports</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">{stats.totalItems}</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{stats.lostItems} Lost &bull; {stats.foundItems} Found</span>
            </div>

            <div className="card p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block uppercase font-semibold">Recovery Rate</span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">{stats.recoveryRate}%</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{stats.recoveredItems} items reunited</span>
            </div>

            <div className="card p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block uppercase font-semibold">Active Claims</span>
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">{stats.totalClaims}</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{stats.pendingClaims} awaiting verification</span>
            </div>

            <div className="card p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block uppercase font-semibold">Physical Handovers</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">{stats.handedOverClaims}</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Officially collected</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Campus Location Hotspots */}
            <div className="card p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Campus Location Hotspots</span>
              </h4>
              <div className="space-y-2">
                {stats.hotspots.map((h, i) => (
                  <div key={h.location} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{i + 1}. {h.location}</span>
                    <span className="badge badge-open font-mono">{h.count} items</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="card p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Category Distribution</span>
              </h4>
              <div className="space-y-2">
                {stats.categories.map((c) => (
                  <div key={c.category} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{CATEGORY_LABELS[c.category] || c.category}</span>
                    <span className="badge badge-open font-mono">{c.count} items</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY AUDIT TRAIL */}
      {adminTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">System Security Audit Logs</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Immutable trace of access, approvals, handovers, and item reports</p>
            </div>
            <button type="button" onClick={loadAuditLogs} className="btn btn-outline btn-sm text-xs">
              <RefreshCw className={`h-3 w-3 ${auditLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-colors">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Resource</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="font-mono text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {log.action}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                      {log.resourceType}: {log.resourceId?.slice(-6) || '—'}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                      {log.actorId ? log.actorId.email : 'System/Anonymous'}
                    </td>
                    <td className="py-2 px-4 text-slate-400 dark:text-slate-500">
                      {log.ip || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DATA EXPORT */}
      {adminTab === 'export' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
          <div className="card p-6 space-y-4">
            <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 w-fit">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Export Complete Inventory</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Download full unredacted CSV dataset including titles, descriptions, locations, storage lockers, and reporter contact details for campus archival.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDownloadExport('items')}
              disabled={exportingType === 'items'}
              className="btn btn-outline text-xs w-full justify-center"
            >
              {exportingType === 'items' ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <span>Preparing Inventory CSV...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download Inventory CSV</span>
                </>
              )}
            </button>
          </div>

          <div className="card p-6 space-y-4">
            <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 w-fit">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Export Ownership Claims</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Download CSV report of all submitted ownership claims, verification status, confirmed collection locations, and handover timestamps.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDownloadExport('claims')}
              disabled={exportingType === 'claims'}
              className="btn btn-outline text-xs w-full justify-center"
            >
              {exportingType === 'claims' ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
                  <span>Preparing Claims CSV...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download Claims CSV</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Handover Confirmation Modal */}
      {handoverModalClaim && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHandoverModalClaim(null);
          }}
        >
          <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Confirm Physical Handover</h3>
              </div>
              <button
                type="button"
                onClick={() => setHandoverModalClaim(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Recording this handover will officially update the associated item status to{' '}
              <strong className="text-slate-900 dark:text-white">Recovered</strong>.
            </p>

            <form onSubmit={handleConfirmHandover} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Confirmed Handover Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={handoverLocationInput}
                  onChange={(e) => setHandoverLocationInput(e.target.value)}
                  placeholder="e.g. Main Library Circulation Desk"
                  className="input text-xs py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setHandoverModalClaim(null)}
                  className="btn btn-outline text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={handoverSubmitting}
                  className="btn btn-primary text-xs"
                >
                  {handoverSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Recording Handover...</span>
                    </>
                  ) : (
                    <span>Record Handover &amp; Recover</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
