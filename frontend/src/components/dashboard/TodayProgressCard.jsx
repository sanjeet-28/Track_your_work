import { CheckCircle2, Clock, Flame } from 'lucide-react';
import { formatDuration } from '../../utils/dateFormats';

export function TodayProgressCard({ overview }) {
  if (!overview) return null;

  const {
    total = 0,
    completed = 0,
    inProgress = 0,
    pending = 0,
    completionRate = 0,
    plannedMinutes = 0,
    actualMinutes = 0
  } = overview;

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/90 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
      {/* Background decorative glows */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/30 text-indigo-300">
              <Flame className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Today's Productivity
            </span>
          </div>
          <span className="text-2xl font-bold font-mono text-indigo-300">
            {completionRate}%
          </span>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-indigo-200 mb-2">
            <span>
              {completed} of {total} {total === 1 ? 'task' : 'tasks'} completed
            </span>
            <span>{total - completed} remaining</span>
          </div>

          <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-indigo-500/30">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(100, Math.max(completionRate, total > 0 ? 4 : 0))}%` }}
            />
          </div>
        </div>

        {/* Time stats breakdown */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-indigo-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-indigo-300 block">Planned Hours</span>
              <span className="text-sm font-bold font-mono">
                {formatDuration(plannedMinutes)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-emerald-300 block">Actual Worked</span>
              <span className="text-sm font-bold font-mono text-emerald-300">
                {formatDuration(actualMinutes)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
