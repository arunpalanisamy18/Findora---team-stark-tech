import { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Lock, LogIn, Upload, Trash2 } from 'lucide-react';
import type { Item, ItemType, ItemCategory, CreateItemInput, AuthUser, LocationItem } from '../types/index.js';
import { ITEM_CATEGORIES, CATEGORY_LABELS } from '../types/index.js';
import { createItem, getLocations, compressImageFile, ApiError } from '../services/api.js';

interface ReportModalProps {
  initialType?: ItemType;
  onClose: () => void;
  onSuccess: (createdItem: Item) => void;
  onInspectMatches: (item: Item) => void;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  initialType = 'lost',
  onClose,
  onSuccess,
  onInspectMatches,
  currentUser,
  onOpenAuth,
}) => {
  const [type, setType] = useState<ItemType>(initialType);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('electronics');
  const [location, setLocation] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [identifyingMarks, setIdentifyingMarks] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [contactName, setContactName] = useState(currentUser?.name || '');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');

  const [availableLocations, setAvailableLocations] = useState<LocationItem[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdItem, setCreatedItem] = useState<Item | null>(null);

  useEffect(() => {
    if (currentUser) {
      setContactName(currentUser.name);
      setContactEmail(currentUser.email);
      if (currentUser.phone) setContactPhone(currentUser.phone);
    }
  }, [currentUser]);

  useEffect(() => {
    getLocations()
      .then((locs) => setAvailableLocations(locs))
      .catch(() => {
        // Fallback to manual entry if location catalogue unavailable
      });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleLocationSelect = (locName: string) => {
    setLocation(locName);
    const found = availableLocations.find((l) => l.name.toLowerCase() === locName.toLowerCase());
    setSelectedLocationId(found?._id);
    if (fieldErrors.location) setFieldErrors((prev) => ({ ...prev, location: '' }));
  };

  const validateClient = (): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    }
    if (!category) {
      errors.category = 'Please choose a category';
    }
    if (!location.trim() || location.trim().length < 2) {
      errors.location = 'Please specify where the item was lost or found';
    }
    if (!description.trim() || description.trim().length < 5) {
      errors.description = 'Please provide a description of at least 5 characters';
    }
    if (!contactName.trim() || contactName.trim().length < 2) {
      errors.contactName = 'Please enter your name';
    }
    if (!contactEmail.trim() || !/^\S+@\S+\.\S+$/.test(contactEmail.trim())) {
      errors.contactEmail = 'Please provide a valid contact email address';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!currentUser) {
      setFormError('You must be signed in with a verified account to report an item.');
      return;
    }

    if (!validateClient()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateItemInput = {
        type,
        title: title.trim(),
        category,
        location: location.trim(),
        locationId: selectedLocationId,
        date: new Date(date).toISOString(),
        description: description.trim(),
        identifyingMarks: identifyingMarks.trim() || undefined,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim() || undefined,
        imageUrl: imageUrl || undefined,
      };

      const result = await createItem(payload);
      setCreatedItem(result);
      onSuccess(result);
    } catch (err: any) {
      if (err instanceof ApiError && err.details) {
        setFieldErrors(err.details);
        setFormError(err.message || 'Validation failed. Please correct the highlighted fields.');
      } else {
        setFormError(err.message || 'Failed to submit report. Please check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900 shrink-0">
          <div>
            <h2 id="report-modal-title" className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {createdItem
                ? 'Report Submitted Successfully'
                : type === 'lost'
                ? 'Report a Lost Item'
                : 'Report a Found Item'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {createdItem
                ? 'Your report is now indexed in Findora database'
                : 'Submit accurate details to enable automated similarity matching'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6">
          {!currentUser ? (
            /* Auth required prompt */
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                <Lock className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Account Verification Required to Report Items
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  To prevent fraudulent or spam listings across campus, reporting lost or found items
                  requires signing in with a verified student or staff account.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button onClick={onClose} className="btn btn-outline text-xs px-4">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="btn btn-primary text-xs px-5"
                >
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  Sign In or Register
                </button>
              </div>
            </div>
          ) : createdItem ? (
            /* Success confirmation screen */
            <div className="text-center py-6 space-y-5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {createdItem.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  {createdItem.type === 'found'
                    ? 'Thank you for reporting this found item. It has been successfully logged with reference ID '
                    : 'Your report has been successfully recorded as a lost item report with ID '}
                  <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">
                    {createdItem._id}
                  </code>.
                </p>
              </div>

              {createdItem.type === 'lost' ? (
                <>
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 max-w-md mx-auto text-left text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span>Immediate Intelligent Match Check</span>
                    </div>
                    <p className="text-amber-800 dark:text-amber-300">
                      Findora can immediately evaluate your lost report against active found items across campus.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onInspectMatches(createdItem)}
                      className="btn btn-primary w-full sm:w-auto"
                    >
                      <Sparkles className="h-4 w-4" />
                      Check Possible Matches Now
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn btn-outline w-full sm:w-auto"
                    >
                      Close &amp; View Listings
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-primary w-full sm:w-auto px-6 py-2.5"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Done &mdash; Return to Dashboard
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Form screen */
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Type Selector Tabs */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Report Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('lost')}
                    className={`py-2 px-4 rounded-lg border text-sm font-semibold transition-all ${
                      type === 'lost'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-200 ring-2 ring-red-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    I Lost an Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('found')}
                    className={`py-2 px-4 rounded-lg border text-sm font-semibold transition-all ${
                      type === 'found'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    I Found an Item
                  </button>
                </div>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="report-title" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Item Title / Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="report-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: '' }));
                    }}
                    placeholder="e.g. Apple MacBook Pro 14"
                    className={`input ${fieldErrors.title ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                  />
                  {fieldErrors.title && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.title}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="report-category" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="report-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ItemCategory)}
                    className="input capitalize"
                  >
                    {ITEM_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="report-location-select" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Campus Location <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="report-location-select"
                    required
                    value={location}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleLocationSelect(val);
                      if (fieldErrors.location) setFieldErrors((prev) => ({ ...prev, location: '' }));
                    }}
                    className={`input ${fieldErrors.location ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                  >
                    <option value="">-- Choose Campus Building / Zone --</option>
                    {availableLocations.map((loc) => (
                      <option key={loc._id} value={loc.name}>
                        {loc.name} {loc.type ? `(${loc.type})` : ''}
                      </option>
                    ))}
                    <option value="Other Campus Location">Other / Custom Campus Spot</option>
                  </select>
                  {location === 'Other Campus Location' && (
                    <input
                      type="text"
                      placeholder="Specify exact building, room, or landmark"
                      onChange={(e) => setLocation(e.target.value)}
                      className="input mt-2 text-xs"
                      required
                    />
                  )}
                  {fieldErrors.location && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.location}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="report-date" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Date {type === 'lost' ? 'Lost' : 'Found'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="report-date"
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="report-desc" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Item Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="report-desc"
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: '' }));
                  }}
                  placeholder="Provide color, brand, model, size, and circumstances of where it was lost or found..."
                  className={`input ${fieldErrors.description ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                />
                {fieldErrors.description && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.description}</p>
                )}
              </div>

              {/* Identifying Marks / Secret Details */}
              <div>
                <label htmlFor="report-marks" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Distinguishing Features or Markings (Optional)
                </label>
                <input
                  id="report-marks"
                  type="text"
                  value={identifyingMarks}
                  onChange={(e) => setIdentifyingMarks(e.target.value)}
                  placeholder="e.g. Unique stickers, scratch on edge, case color..."
                  className="input"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Omitted from public listings for privacy; used by matching algorithms and administrators to verify claims.
                </p>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Attach Item Photograph (Optional)
                </label>
                {imageUrl ? (
                  <div className="relative rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800/50 p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={imageUrl}
                        alt="Uploaded preview"
                        className="h-16 w-16 object-cover rounded-md border border-slate-200 dark:border-slate-700"
                      />
                      <div className="text-xs">
                        <p className="font-semibold text-slate-900 dark:text-white">Photo Attached</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Auto-compressed and ready</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="btn btn-outline btn-sm text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-red-200 dark:border-red-900/60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-lg p-4 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                      <Upload className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Upload Photograph of Item
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      PNG, JPG, or WEBP (automatically optimized client-side)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImageFile(file);
                            setImageUrl(compressed);
                          } catch (err: any) {
                            setFormError(err.message || 'Failed to process image');
                          }
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Reporter Contact Info */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                  Your Contact Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="report-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="report-name"
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => {
                        setContactName(e.target.value);
                        if (fieldErrors.contactName) setFieldErrors((prev) => ({ ...prev, contactName: '' }));
                      }}
                      placeholder="e.g. Maya Iyer"
                      className={`input ${fieldErrors.contactName ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    />
                    {fieldErrors.contactName && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.contactName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="report-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      University Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="report-email"
                      type="email"
                      required
                      readOnly={Boolean(currentUser)}
                      value={contactEmail}
                      onChange={(e) => {
                        setContactEmail(e.target.value);
                        if (fieldErrors.contactEmail) setFieldErrors((prev) => ({ ...prev, contactEmail: '' }));
                      }}
                      placeholder="name@campus.edu"
                      className={`input ${currentUser ? 'bg-slate-50 dark:bg-slate-800 cursor-not-allowed' : ''} ${fieldErrors.contactEmail ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    />
                    {fieldErrors.contactEmail && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.contactEmail}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="report-phone" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      id="report-phone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98765 00000"
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-outline text-xs"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary text-xs"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Submitting Report...</span>
                    </>
                  ) : (
                    <span>Submit {type === 'lost' ? 'Lost Item' : 'Found Item'} Report</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};