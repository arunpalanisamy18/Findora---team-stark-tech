import { MapPin, Calendar, ArrowRight, Tag } from 'lucide-react';
import type { Item } from '../types/index.js';
import { CATEGORY_LABELS } from '../types/index.js';

interface ItemCardProps {
  item: Item;
  onViewDetails: (item: Item) => void;
  onClaimItem?: (item: Item) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onViewDetails }) => {
  const isLost = item.type === 'lost';
  const rawDate = item.date || item.createdAt;
  const parsedDate = rawDate ? new Date(rawDate) : new Date();
  const formattedDate = isNaN(parsedDate.getTime())
    ? 'Recently'
    : parsedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  const getStatusBadge = () => {
    switch (item.status) {
      case 'open':
        return isLost ? (
          <span className="badge badge-lost">Lost</span>
        ) : (
          <span className="badge badge-found">Found</span>
        );
      case 'matched':
        return <span className="badge badge-matched">Match Suggested</span>;
      case 'claimed':
        return <span className="badge badge-claimed">Claim Pending</span>;
      case 'recovered':
        return <span className="badge badge-recovered">Recovered</span>;
      case 'closed':
        return <span className="badge badge-closed">Closed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between p-5 shadow-xs">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                isLost
                  ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/40'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
              }`}
            >
              {isLost ? 'Lost Item' : 'Found Item'}
            </span>
            {getStatusBadge()}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
            <Tag className="h-3 w-3 text-slate-400" />
            {CATEGORY_LABELS[item.category] || item.category}
          </span>
        </div>

        {/* Photo Thumbnail if available */}
        {item.imageUrl && (
          <div className="mb-3 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 max-h-36 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-36 object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        {/* Item Title */}
        <h3 className="text-base font-semibold text-slate-900 dark:text-white line-clamp-1 mb-2 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
          <button
            type="button"
            onClick={() => onViewDetails(item)}
            className="text-left focus:outline-none focus-visible:underline"
          >
            {item.title}
          </button>
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {item.description}
        </p>

        {/* Location & Date */}
        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Reported {formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(item)}
          className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 flex items-center gap-1 py-1 focus:outline-none focus-visible:underline"
        >
          <span>{isLost ? 'Inspect Matches' : 'View Details'}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
