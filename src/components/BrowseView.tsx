import { useState, useEffect } from 'react';
import { Search, Filter, X, RefreshCw, AlertCircle, Sparkles, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import type { Item, ItemType, ItemCategory, ItemStatus, ItemFilters } from '../types/index.js';
import { ITEM_CATEGORIES, CATEGORY_LABELS } from '../types/index.js';
import { StatsBanner } from './StatsBanner.js';
import { ItemCard } from './ItemCard.js';

interface BrowseViewProps {
  items: Item[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  filters: ItemFilters;
  onFilterChange: (newFilters: ItemFilters) => void;
  onRefresh: () => void;
  onViewItem: (item: Item) => void;
  onClaimItem: (item: Item) => void;
  onOpenReport: (type: 'lost' | 'found') => void;
}

export const BrowseView: React.FC<BrowseViewProps> = ({
  items,
  totalCount,
  loading,
  error,
  filters,
  onFilterChange,
  onRefresh,
  onViewItem,
  onClaimItem,
  onOpenReport,
}) => {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const currentPage = filters.page || 1;
  const currentLimit = filters.limit || 50;
  const totalPages = Math.max(1, Math.ceil(totalCount / currentLimit));

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    onFilterChange({ ...filters, page: newPage });
  };

  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...filters, search: searchInput.trim(), page: 1 });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    onFilterChange({ ...filters, search: '', page: 1 });
  };

  const handleTypeChange = (type: ItemType | '') => {
    onFilterChange({ ...filters, type, page: 1 });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = (e.target.value as ItemCategory) || '';
    onFilterChange({ ...filters, category, page: 1 });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = (e.target.value as ItemStatus) || '';
    onFilterChange({ ...filters, status, page: 1 });
  };

  const handleResetAllFilters = () => {
    setSearchInput('');
    onFilterChange({ search: '', type: '', category: '', status: '', page: 1 });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.type || filters.category || filters.status
  );

  return (
    <div className="space-y-6">
      {/* Streamlined Editorial Introduction */}
      <section className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs text-left relative overflow-hidden">
        <div className="max-w-3xl space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-semibold">
            <Sparkles className="h-3 w-3 text-amber-700 dark:text-amber-400" />
            <span>Campus Lost &amp; Found Directory</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Reunite with your lost belongings across campus.
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Browse turned-in items, search active reports, evaluate explainable similarity matches,
            and submit verified ownership claims for physical collection.
          </p>
        </div>
      </section>

      {/* Streamlined Stats Metric Strip */}
      <StatsBanner items={items} totalCount={totalCount} />

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
          {/* Top Row: Search input + Search / Refresh buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by keywords, title, location, or description..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input pl-9 pr-8 text-xs py-2"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="btn btn-primary text-xs py-2 px-4 shrink-0"
              >
                Search
              </button>
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="btn btn-outline text-xs py-2 px-3 shrink-0"
                title="Refresh listings"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Bottom Row: Type Tabs & Dropdowns */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
                Type:
              </span>
              <button
                onClick={() => handleTypeChange('')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  !filters.type
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Items
              </button>
              <button
                onClick={() => handleTypeChange('lost')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filters.type === 'lost'
                    ? 'bg-red-700 text-white'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/60'
                }`}
              >
                Lost Only
              </button>
              <button
                onClick={() => handleTypeChange('found')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filters.type === 'found'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                }`}
              >
                Found Only
              </button>
            </div>

            {/* Category and Status Dropdowns */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <label htmlFor="filter-category" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Category:
                </label>
                <select
                  id="filter-category"
                  value={filters.category || ''}
                  onChange={handleCategoryChange}
                  className="input text-xs py-1 px-2.5 w-auto"
                >
                  <option value="">All Categories</option>
                  {ITEM_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label htmlFor="filter-status" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status:
                </label>
                <select
                  id="filter-status"
                  value={filters.status || ''}
                  onChange={handleStatusChange}
                  className="input text-xs py-1 px-2.5 w-auto"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="claimed">Claim Pending</option>
                  <option value="recovered">Recovered</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips Strip */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex-wrap text-xs">
              <span className="text-slate-400 font-medium">Active filters:</span>

              {filters.search && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px]">
                  Search: &ldquo;{filters.search}&rdquo;
                  <button
                    onClick={handleClearSearch}
                    className="hover:text-red-700 dark:hover:text-red-400 ml-0.5"
                    title="Remove search"
                  >
                    &times;
                  </button>
                </span>
              )}

              {filters.type && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] capitalize">
                  Type: {filters.type}
                  <button
                    onClick={() => handleTypeChange('')}
                    className="hover:text-red-700 dark:hover:text-red-400 ml-0.5"
                    title="Clear type"
                  >
                    &times;
                  </button>
                </span>
              )}

              {filters.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px]">
                  Category: {CATEGORY_LABELS[filters.category as ItemCategory] || filters.category}
                  <button
                    onClick={() => onFilterChange({ ...filters, category: '', page: 1 })}
                    className="hover:text-red-700 dark:hover:text-red-400 ml-0.5"
                    title="Clear category"
                  >
                    &times;
                  </button>
                </span>
              )}

              {filters.status && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] capitalize">
                  Status: {filters.status === 'claimed' ? 'Claim Pending' : filters.status}
                  <button
                    onClick={() => onFilterChange({ ...filters, status: '', page: 1 })}
                    className="hover:text-red-700 dark:hover:text-red-400 ml-0.5"
                    title="Clear status"
                  >
                    &times;
                  </button>
                </span>
              )}

              <button
                onClick={handleResetAllFilters}
                className="text-amber-800 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-300 font-semibold underline text-[11px] ml-auto"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={onRefresh}
            className="btn btn-outline btn-sm text-xs border-red-300 text-red-900 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="card p-5 animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-4 bg-slate-100 rounded w-1/4" />
              </div>
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-12 bg-slate-100 rounded" />
              <div className="h-4 bg-slate-100 rounded w-1/2 pt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Filter className="h-6 w-6" />
          </div>
          {hasActiveFilters ? (
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No items match your active filters</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Try adjusting or clearing your search term, category, or status filters.
              </p>
              <div className="pt-2">
                <button onClick={handleResetAllFilters} className="btn btn-outline text-xs">
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No items reported yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Be the first to submit a lost belongings report or log a turned-in item.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenReport('lost')}
                  className="btn btn-outline text-xs"
                >
                  Report Lost Item
                </button>
                <button
                  type="button"
                  onClick={() => onOpenReport('found')}
                  className="btn btn-primary text-xs"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  <span>Report Found Item</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Item Cards Grid */}
      {!loading && !error && items.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3 px-1">
            <span>
              Showing <strong>{items.length}</strong> of <strong>{totalCount}</strong> listings
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                onViewDetails={onViewItem}
                onClaimItem={onClaimItem}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-5 mt-6 text-xs text-slate-600 dark:text-slate-400">
              <span>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="btn btn-outline btn-sm text-xs flex items-center gap-1 disabled:opacity-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="btn btn-outline btn-sm text-xs flex items-center gap-1 disabled:opacity-50"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};