import { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Lock, MapPin, LogIn, Upload, Trash2 } from 'lucide-react';
import type { Item, Claim, CreateClaimInput, AuthUser } from '../types/index.js';
import { submitClaim, compressImageFile, ApiError } from '../services/api.js';

interface ClaimModalProps {
  item: Item;
  onClose: () => void;
  onSuccess: (claim: Claim) => void;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  item,
  onClose,
  onSuccess,
  currentUser,
  onOpenAuth,
}) => {
  const [claimantName, setClaimantName] = useState(currentUser?.name || '');
  const [claimantEmail, setClaimantEmail] = useState(currentUser?.email || '');
  const [claimantPhone, setClaimantPhone] = useState(currentUser?.phone || '');
  const [proofDescription, setProofDescription] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [identifyingDetails, setIdentifyingDetails] = useState('');
  const [proposedHandoverLocation, setProposedHandoverLocation] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdClaim, setCreatedClaim] = useState<Claim | null>(null);

  useEffect(() => {
    if (currentUser) {
      setClaimantName(currentUser.name);
      setClaimantEmail(currentUser.email);
      if (currentUser.phone) setClaimantPhone(currentUser.phone);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!claimantName.trim() || claimantName.trim().length < 2) {
      errors.claimantName = 'Claimant name must be at least 2 characters';
    }
    if (!claimantEmail.trim() || !/^\S+@\S+\.\S+$/.test(claimantEmail.trim())) {
      errors.claimantEmail = 'Please provide a valid email address';
    }
    if (!claimantPhone.trim() || claimantPhone.trim().length < 5) {
      errors.claimantPhone = 'Please provide a valid phone number (at least 5 digits)';
    }
    if (!proofDescription.trim() || proofDescription.trim().length < 10) {
      errors.proofDescription =
        'Proof description must be at least 10 characters explaining evidence of ownership';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!currentUser) {
      setFormError('You must be signed in with a verified account to submit a claim.');
      return;
    }

    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: CreateClaimInput = {
        itemId: item._id,
        claimantName: claimantName.trim(),
        claimantEmail: claimantEmail.trim().toLowerCase(),
        claimantPhone: claimantPhone.trim(),
        proofDescription: proofDescription.trim(),
        proofImageUrl: proofImageUrl.trim() || undefined,
        identifyingDetails: identifyingDetails.trim() || undefined,
        proposedHandoverLocation: proposedHandoverLocation.trim() || undefined,
      };

      const result = await submitClaim(payload);
      setCreatedClaim(result);
      onSuccess(result);
    } catch (err: any) {
      if (err instanceof ApiError && err.details) {
        setFieldErrors(err.details);
        setFormError(err.message || 'Validation failed. Please correct the highlighted errors.');
      } else {
        setFormError(err.message || 'Failed to submit claim. Please try again.');
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
      aria-labelledby="claim-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 id="claim-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Submit Ownership Claim
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Provide verifiable evidence to recover this item
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Target Item Summary */}
        <div className="bg-amber-50/60 dark:bg-amber-950/40 border-b border-amber-100 dark:border-amber-900/40 px-6 py-3 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Claiming Item:</span>{' '}
            <span className="text-amber-950 dark:text-amber-300 font-bold">{item.title}</span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {item.location}
          </span>
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
                  Account Verification Required
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  To protect campus belongings and ensure authentic claims, claim submission requires
                  signing in with a verified account.
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
          ) : createdClaim ? (
            /* Success confirmation */
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Claim Submitted for Administrative Verification
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Your claim has been recorded with reference{' '}
                  <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">
                    {createdClaim._id}
                  </code>.
                </p>
              </div>

              {/* Status explanation */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 text-left space-y-2 max-w-md mx-auto">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Two-Step Verification Process</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  The item is now marked as <strong className="text-slate-800 dark:text-slate-200">Claim Pending</strong>. Campus
                  administrators will inspect the proof details provided and contact you via email or phone
                  to complete handover verification.
                </p>
              </div>

              <button onClick={onClose} className="btn btn-primary text-xs px-6">
                Done
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Notice */}
              <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                <Lock className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  To prevent unauthorized claims, please provide details only the rightful owner would know
                  (e.g., lock screen wallpaper, passwords/codes, specific scratch locations, contents of pockets or bags).
                </p>
              </div>

              {/* Claimant Contact Details */}
              <div className="space-y-3">
                <div>
                  <label htmlFor="claim-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="claim-name"
                    type="text"
                    required
                    value={claimantName}
                    onChange={(e) => {
                      setClaimantName(e.target.value);
                      if (fieldErrors.claimantName) setFieldErrors((prev) => ({ ...prev, claimantName: '' }));
                    }}
                    placeholder="e.g. Aarav Sharma"
                    className={`input ${fieldErrors.claimantName ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                  />
                  {fieldErrors.claimantName && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.claimantName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="claim-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="claim-email"
                      type="email"
                      required
                      readOnly={Boolean(currentUser)}
                      value={claimantEmail}
                      onChange={(e) => {
                        setClaimantEmail(e.target.value);
                        if (fieldErrors.claimantEmail) setFieldErrors((prev) => ({ ...prev, claimantEmail: '' }));
                      }}
                      placeholder="name@campus.edu"
                      className={`input ${currentUser ? 'bg-slate-50 dark:bg-slate-800 cursor-not-allowed' : ''} ${fieldErrors.claimantEmail ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    />
                    {currentUser && (
                      <p className="text-[11px] text-slate-400 mt-0.5">Matched to your signed-in account</p>
                    )}
                    {fieldErrors.claimantEmail && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.claimantEmail}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="claim-phone" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="claim-phone"
                      type="tel"
                      required
                      value={claimantPhone}
                      onChange={(e) => {
                        setClaimantPhone(e.target.value);
                        if (fieldErrors.claimantPhone) setFieldErrors((prev) => ({ ...prev, claimantPhone: '' }));
                      }}
                      placeholder="+91 98765 43210"
                      className={`input ${fieldErrors.claimantPhone ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    />
                    {fieldErrors.claimantPhone && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.claimantPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Ownership Proof */}
              <div>
                <label htmlFor="claim-proof" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Ownership Verification Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="claim-proof"
                  rows={4}
                  required
                  value={proofDescription}
                  onChange={(e) => {
                    setProofDescription(e.target.value);
                    if (fieldErrors.proofDescription) setFieldErrors((prev) => ({ ...prev, proofDescription: '' }));
                  }}
                  placeholder="Describe secret or unique aspects of this item: wallpaper, account username, contents inside, specific damages, or purchase date..."
                  className={`input ${fieldErrors.proofDescription ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                />
                {fieldErrors.proofDescription && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.proofDescription}</p>
                )}
              </div>

              {/* Ownership Proof Photo Upload */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Upload Proof Document / Photo (Receipt, Warranty, Photo with Item, or ID)
                </label>
                {proofImageUrl ? (
                  <div className="relative rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800/50 p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={proofImageUrl}
                        alt="Proof preview"
                        className="h-16 w-16 object-cover rounded-md border border-slate-200 dark:border-slate-700"
                      />
                      <div className="text-xs">
                        <p className="font-semibold text-slate-900 dark:text-white">Proof Image Attached</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Visible only to verifying administrators</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProofImageUrl('')}
                      className="btn btn-outline btn-sm text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-red-200 dark:border-red-900/60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-lg p-3.5 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                      <Upload className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Attach Ownership Proof Image (Optional)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Receipt, box photo, serial number photo, or selfie with item
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
                            setProofImageUrl(compressed);
                          } catch (err: any) {
                            setFormError(err.message || 'Failed to process image');
                          }
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Serial / Secret ID Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="claim-serial" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Serial Number / Reference (Optional)
                  </label>
                  <input
                    id="claim-serial"
                    type="text"
                    value={identifyingDetails}
                    onChange={(e) => setIdentifyingDetails(e.target.value)}
                    placeholder="e.g. Serial ending in W2K9"
                    className="input text-xs"
                  />
                </div>

                <div>
                  <label htmlFor="claim-handover-loc" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Proposed Handover Location (Optional)
                  </label>
                  <input
                    id="claim-handover-loc"
                    type="text"
                    value={proposedHandoverLocation}
                    onChange={(e) => setProposedHandoverLocation(e.target.value)}
                    placeholder="e.g. Student Union Desk"
                    className="input text-xs"
                  />
                </div>
              </div>

              {/* Actions */}
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
                      <span>Submitting Claim...</span>
                    </>
                  ) : (
                    <span>Submit Claim for Review</span>
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