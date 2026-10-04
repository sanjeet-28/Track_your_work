import { FolderTree } from 'lucide-react';
import { formatDuration } from '../../utils/dateFormats';

export function CategoryBreakdownChart({ categoryData }) {
  const categories = categoryData?.categories || [];
  const totalHours = categoryData?.totalHours || 0;

  if (categories.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center text-xs text-slate-400">
        No category tracking data found.
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Domain Focus
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Time by Category ({totalHours}h Total)
          </h3>
        </div>
        <FolderTree className="w-5 h-5 text-indigo-500" />
      </div>

      {/* Progress Bars List */}
      <div className="space-y-3.5">
        {categories.map((c) => (
          <div key={c.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {c.name}
                </span>
                <span className="text-slate-400">
                  ({c.completedTasks}/{c.totalTasks} done)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {c.hours}h
                </span>
                <span className="text-slate-400 font-mono text-[11px] min-w-[32px] text-right">
                  {c.percentage}%
                </span>
              </div>
            </div>

            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${c.percentage}%`,
                  backgroundColor: c.color
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
