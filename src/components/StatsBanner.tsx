import { Package, Search, CheckCircle2, Clock } from 'lucide-react';
import type { Item } from '../types/index.js';

interface StatsBannerProps {
  items: Item[];
  totalCount: number;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ items, totalCount }) => {
  const lostCount = items.filter((i) => i.type === 'lost').length;
  const foundCount = items.filter((i) => i.type === 'found').length;
  const recoveredCount = items.filter((i) => i.status === 'recovered').length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <Package className="h-3.5 w-3.5" />
        </div>
        <span>
          <strong className="text-slate-900 dark:text-white font-semibold">{totalCount}</strong> Total Reports
        </span>
      </div>

      <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-800" />

      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
          <Search className="h-3.5 w-3.5" />
        </div>
        <span>
          <strong className="text-slate-900 dark:text-white font-semibold">{lostCount}</strong> Lost Items
        </span>
      </div>

      <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-800" />

      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
          <Clock className="h-3.5 w-3.5" />
        </div>
        <span>
          <strong className="text-slate-900 dark:text-white font-semibold">{foundCount}</strong> Found Items
        </span>
      </div>

      <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-800" />

      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </div>
        <span>
          <strong className="text-emerald-800 dark:text-emerald-400 font-semibold">{recoveredCount}</strong> Successfully Reunited
        </span>
      </div>
    </div>
  );
};