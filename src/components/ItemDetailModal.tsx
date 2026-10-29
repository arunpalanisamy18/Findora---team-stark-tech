import React, { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Tag,
  User,
  Mail,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Item, MatchesData, MatchResult } from '../types/index.js';
import { CATEGORY_LABELS } from '../types/index.js';
import { getItemMatches } from '../services/api.js';

interface ItemDetailModalProps {
  item: Item;
  onClose: () => void;
  onClaimItem: (item: Item) => void;
  onSelectAnotherItem: (item: Item) => void;
  hideClaimAction?: boolean;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onClaimItem,
  onSelectAnotherItem,
  hideClaimAction = false,
}) => {
  const [matchesData, setMatchesData] = useState<MatchesData | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    if (item.type !== 'lost') {
      setLoadingMatches(false);
      return;
    }
    async function loadMatches() {
      setLoadingMatches(true);
      setMatchError(null);
      try {
        const data = await getItemMatches(item._id);
        if (isMounted) {
          setMatchesData(data);
          // By default expand the highest match breakdown
          if (data.matches.length > 0) {
            setExpandedBreakdowns({ [data.matches[0].candidate._id]: true });
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setMatchError(err.message || 'Failed to calculate candidate matches');
        }
      } finally {
        if (isMounted) {
          setLoadingMatches(false);
        }
      }
    }

    loadMatches();
    return () => {
      isMounted = false;
    };
  }, [item._id, item.type]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const toggleBreakdown = (candidateId: string) => {
    setExpandedBreakdowns((prev) => ({
      ...prev,
      [candidateId]: !prev[candidateId],
    }));
  };

  const isLost = item.type === 'lost';
  const canClaim = !isLost && (item.status === 'open' || item.status === 'matched') && !hideClaimAction;
  const rawDate = item.date || item.createdAt;
  const parsedDate = rawDate ? new Date(rawDate) : new Date();
  const formattedDate = isNaN(parsedDate.getTime())
    ? 'Recently reported'
    : parsedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-item-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className={`text-xs uppercase font-bold px-2 py-0.5 rounded tracking-wide ${
                isLost
                  ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {isLost ? 'Lost Item Report' : 'Found Item Report'}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 capitalize">
              Status: {item.status}
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Main Info */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 id="modal-item-title" className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {item.title}
              </h2>
              {canClaim && (
                <button
                  onClick={() => onClaimItem(item)}
                  className="btn btn-primary btn-sm shrink-0"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Claim This Item
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-300 mb-4">
              <span className="flex items-center gap-1 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                <Tag className="h-3.5 w-3.5 text-slate-400" />
                Category: {CATEGORY_LABELS[item.category] || item.category}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {item.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Reported {formattedDate}
              </span>
            </div>

            {/* Item Image if available */}
            {item.imageUrl && (
              <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 max-h-72 flex items-center justify-center">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="max-h-72 w-auto object-contain mx-auto"
                />
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4 border border-slate-200 dark:border-slate-700/60">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Description
              </h4>
              <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {item.description}
              </p>

              {item.identifyingMarks && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Identifying Features / Markings
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{item.identifyingMarks}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reporter & Contact Info */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              Reporter Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-900 dark:text-white">{item.contactName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {item.contactEmail ? (
                  <span>{item.contactEmail}</span>
                ) : (
                  <span className="italic text-slate-400">Direct contact info protected for student privacy</span>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded border border-slate-200 dark:border-slate-800 flex items-start gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Privacy &amp; Security:</span>
            <span>
              Claimant ownership proofs, serial numbers, and sensitive identification information are
              never published publicly. Only administrators review submitted claim evidence.
            </span>
          </div>

          {/* Candidate Matches (Strictly for Lost Item Reports) */}
          {isLost ? (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Explainable Candidate Matches
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Comparing against active found records using multi-attribute similarity
                    </p>
                  </div>
                </div>

                {loadingMatches && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Calculating scores...</span>
                  </div>
                )}
              </div>

              {matchError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
                  <span>{matchError}</span>
                  <button
                    onClick={() => getItemMatches(item._id).then(setMatchesData)}
                    className="font-medium underline hover:text-red-900 dark:hover:text-red-200"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loadingMatches && matchesData && matchesData.matches.length === 0 && (
                <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    No candidate matches found above the confidence threshold
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    The matching algorithm evaluates category, title keywords, description overlap, location,
                    and date proximity. Check back as new found reports are submitted.
                  </p>
                </div>
              )}

              {!loadingMatches && matchesData && matchesData.matches.length > 0 && (
                <div className="space-y-4">
                  {matchesData.matches.map((m: MatchResult) => {
                    const isExpanded = !!expandedBreakdowns[m.candidate._id];
                    const confidenceBadge =
                      m.confidence === 'high'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : m.confidence === 'medium'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                    return (
                      <div
                        key={m.candidate._id}
                        className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${confidenceBadge}`}
                                >
                                  {m.totalScore}% Match &bull; {m.confidence} Confidence
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  Found Item
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {m.candidate.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => onSelectAnotherItem(m.candidate)}
                                className="btn btn-outline btn-sm text-xs"
                                title="Inspect this candidate item"
                              >
                                Inspect Item
                                <ExternalLink className="h-3 w-3" />
                              </button>
                              {m.candidate.status !== 'recovered' &&
                                m.candidate.status !== 'closed' && (
                                  <button
                                    onClick={() => onClaimItem(m.candidate)}
                                    className="btn btn-primary btn-sm text-xs"
                                    title="Submit claim for this found item"
                                  >
                                    Claim
                                  </button>
                                )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-2">
                            {m.candidate.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {m.candidate.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {new Date(m.candidate.date || m.candidate.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Summary sentence */}
                          <div className="mt-3 p-2.5 rounded bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 text-xs text-amber-950 dark:text-amber-300 font-medium">
                            {m.summary}
                          </div>

                          {/* Toggle explanation breakdown */}
                          <button
                            onClick={() => toggleBreakdown(m.candidate._id)}
                            className="mt-3 flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-400 transition-colors"
                          >
                            <span>{isExpanded ? 'Hide' : 'Show'} Transparent Scoring Breakdown</span>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </div>

                        {/* Expandable Breakdown Table */}
                        {isExpanded && (
                          <div className="bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-xs">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                                    <th className="py-1.5 font-semibold">Factor</th>
                                    <th className="py-1.5 font-semibold">Score</th>
                                    <th className="py-1.5 font-semibold">Explanation</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                  <tr>
                                    <td className="py-2 font-medium text-slate-800 dark:text-slate-200">Category</td>
                                    <td className="py-2 text-slate-900 dark:text-white font-bold">
                                      {m.breakdown.category.score} / {m.breakdown.category.max}
                                    </td>
                                    <td className="py-2 text-slate-600 dark:text-slate-400">{m.breakdown.category.reason}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-2 font-medium text-slate-800 dark:text-slate-200">Title Phrasing</td>
                                    <td className="py-2 text-slate-900 dark:text-white font-bold">
                                      {m.breakdown.title.score} / {m.breakdown.title.max}
                                    </td>
                                    <td className="py-2 text-slate-600 dark:text-slate-400">{m.breakdown.title.reason}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-2 font-medium text-slate-800 dark:text-slate-200">Description Terms</td>
                                    <td className="py-2 text-slate-900 dark:text-white font-bold">
                                      {m.breakdown.description.score} / {m.breakdown.description.max}
                                    </td>
                                    <td className="py-2 text-slate-600 dark:text-slate-400">{m.breakdown.description.reason}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-2 font-medium text-slate-800 dark:text-slate-200">Location Proximity</td>
                                    <td className="py-2 text-slate-900 dark:text-white font-bold">
                                      {m.breakdown.location.score} / {m.breakdown.location.max}
                                    </td>
                                    <td className="py-2 text-slate-600 dark:text-slate-400">{m.breakdown.location.reason}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-2 font-medium text-slate-800 dark:text-slate-200">Date Proximity</td>
                                    <td className="py-2 text-slate-900 dark:text-white font-bold">
                                      {m.breakdown.date.score} / {m.breakdown.date.max}
                                    </td>
                                    <td className="py-2 text-slate-600 dark:text-slate-400">{m.breakdown.date.reason}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* If Found Item: Campus Custody & Verified Claim Option */
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-5 space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Campus Custody &amp; Verified Claim Procedure
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      This item is securely catalogued in campus custody at <strong>{item.location}</strong>. If this item belongs to you, submit an ownership claim with identifying proof (photos, serial numbers, or distinctive marks).
                    </p>
                    {canClaim ? (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onClaimItem(item);
                          }}
                          className="btn btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>Submit Ownership Claim</span>
                        </button>
                      </div>
                    ) : item.status === 'claimed' ? (
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800">
                          <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Ownership Claim Verified / Active</span>
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-3.5 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">ID: {item._id}</span>
          <button onClick={onClose} className="btn btn-outline text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
