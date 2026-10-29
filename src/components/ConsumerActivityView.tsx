import { useState, useEffect } from 'react';
import {
  Package,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Tag,
  ArrowRight,
  LogIn,
  Check,
} from 'lucide-react';
import type { Item, Claim, AuthUser } from '../types/index.js';
import { CATEGORY_LABELS } from '../types/index.js';
import { getMyItems, getMyClaims, updateMyItemStatus } from '../services/api.js';

interface ConsumerActivityViewProps {
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onViewItem: (item: Item, hideClaimAction?: boolean) => void;
  onOpenReport: (type: 'lost' | 'found') => void;
}

export const ConsumerActivityView: React.FC<ConsumerActivityViewProps> = ({
  currentUser,
  onOpenAuth,
  onViewItem,
  onOpenReport,
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'claims'>('items');
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadActivity = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const [items, claims] = await Promise.all([getMyItems(), getMyClaims()]);
      setMyItems(items);
      setMyClaims(claims);
    } catch (err: any) {
      setError(err.message || 'Failed to load your activity records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, [currentUser]);

  const handleMarkResolved = async (itemId: string) => {
    setResolvingId(itemId);
    setError(null);
    try {
      const updated = await updateMyItemStatus(itemId, 'recovered');
      setMyItems((prev) => prev.map((item) => (item._id === itemId ? updated : item)));
      setSuccessMessage('Item status marked as recovered!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update item status');
    } finally {
      setResolvingId(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">Sign In to View Your Activity</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Access your personal dashboard to track items you reported, inspect similarity matches, and check ownership claim verification status.
          </p>
        </div>
        <button
          onClick={onOpenAuth}
          className="btn btn-primary text-xs w-full py-2.5 justify-center"
        >
          <LogIn className="h-4 w-4" />
          <span>Sign In / Register</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Editorial Dashboard Banner */}
      <section className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-semibold">
              <Sparkles className="h-3 w-3 text-amber-700 dark:text-amber-400" />
              <span>Personal Student Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Campus Activity &amp; Claims
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Track reports you submitted, view candidate similarity recommendations, and check verification and collection instructions for your claims.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={loadActivity}
              disabled={loading}
              className="btn btn-outline text-xs py-2 px-3 flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'items'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>My Reported Items</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'items' ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {myItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('claims')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'claims'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>My Ownership Claims</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'claims' ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {myClaims.length}
            </span>
          </button>
        </div>
      </div>

      {/* Success notification */}
      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
              <div className="h-16 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* TAB 1: MY REPORTED ITEMS */}
      {!loading && activeTab === 'items' && (
        <div>
          {myItems.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                <Package className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">You haven&rsquo;t reported any items yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Submit a report for any belongings you lost or turned-in found items across campus.
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <button type="button" onClick={() => onOpenReport('lost')} className="btn btn-outline text-xs">
                  Report Lost Item
                </button>
                <button type="button" onClick={() => onOpenReport('found')} className="btn btn-primary text-xs">
                  Report Found Item
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myItems.map((item) => {
                const isLost = item.type === 'lost';
                const formattedDate = new Date(item.date || item.createdAt).toLocaleDateString();

                return (
                  <div key={item._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                    <div>
                      {/* Photo Thumbnail */}
                      {item.imageUrl && (
                        <div className="mb-3 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 max-h-36 border border-slate-100 dark:border-slate-800">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-36 object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                            isLost
                              ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/40'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
                          }`}
                        >
                          {isLost ? 'Lost Item' : 'Found Item'}
                        </span>
                        <span className="badge badge-open capitalize text-xs">
                          {item.status}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 line-clamp-1">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3 w-3 text-slate-400" />
                          <span>{CATEGORY_LABELS[item.category] || item.category}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>Reported {formattedDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onViewItem(item, true)}
                        className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 flex items-center gap-1"
                      >
                        <span>{isLost ? 'Inspect Matches' : 'View Item Details'}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>

                      {item.status === 'open' && isLost && (
                        <button
                          type="button"
                          onClick={() => handleMarkResolved(item._id)}
                          disabled={resolvingId === item._id}
                          className="btn btn-outline btn-sm text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          title="Click if you found your belongings"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Mark Resolved</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY OWNERSHIP CLAIMS */}
      {!loading && activeTab === 'claims' && (
        <div>
          {myClaims.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No ownership claims submitted yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Browse found items in the directory and click &ldquo;Claim Item&rdquo; if you see your lost belongings.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {myClaims.map((claim) => {
                const item = typeof claim.itemId === 'object' && claim.itemId !== null ? (claim.itemId as Item) : null;
                const statusClass =
                  claim.status === 'approved'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : claim.status === 'rejected'
                    ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';

                return (
                  <div
                    key={claim._id}
                    className="card p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    {/* Claim Header */}
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
                      </div>
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500">Claim ID: {claim._id}</span>
                    </div>

                    {/* Associated Item Card */}
                    {item && (
                      <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="h-12 w-12 object-cover rounded-md border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          )}
                          <div>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Target Item
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {item.location} &bull; Reported {new Date(item.date || item.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onViewItem(item, true)}
                          className="btn btn-outline btn-sm text-xs shrink-0"
                        >
                          View Item
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Collection Instructions if Approved */}
                    {claim.status === 'approved' && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-xs">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Ownership Claim Approved &mdash; Ready for Physical Collection</span>
                        </div>
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                          Campus security has reviewed and accepted your claim. Please visit the designated desk to collect your item:
                        </p>
                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-emerald-200 dark:border-emerald-900/60 text-xs text-slate-800 dark:text-slate-200">
                          <p>
                            <strong>Collection Location:</strong>{' '}
                            <span className="text-emerald-900 dark:text-emerald-300 font-bold">
                              {claim.confirmedHandoverLocation || claim.proposedHandoverLocation || 'Campus Security Main Desk'}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            &bull; Please bring your institutional student ID card for physical verification.
                          </p>
                        </div>
                        {claim.handedOverAt && (
                          <p className="text-xs text-emerald-900 dark:text-emerald-300 font-semibold pt-1">
                            &check; Physical handover successfully completed on{' '}
                            {new Date(claim.handedOverAt).toLocaleDateString()}.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Rejected Notice */}
                    {claim.status === 'rejected' && (
                      <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-lg p-3 text-xs text-red-800 dark:text-red-300 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <span>Claim Not Verified</span>
                        </div>
                        <p className="text-[11px]">
                          {claim.adminNotes ||
                            'The submitted proof of ownership could not be verified by security personnel.'}
                        </p>
                      </div>
                    )}

                    {/* Submitted Evidence Summary */}
                    <div className="text-xs space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Submitted Ownership Proof:</span>
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5 whitespace-pre-wrap">{claim.proofDescription}</p>
                      </div>

                      {claim.proofImageUrl && (
                        <div>
                          <span className="font-semibold text-slate-700 block mb-1">Attached Proof Image:</span>
                          <img
                            src={claim.proofImageUrl}
                            alt="Proof document"
                            className="h-20 w-auto rounded border border-slate-200 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
