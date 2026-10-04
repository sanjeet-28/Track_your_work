import { TrendingUp, TrendingDown, Minus, Info, ShieldCheck } from 'lucide-react';

export function ProductivityScoreCard({ scoreData }) {
  if (!scoreData) return null;

  const {
    score = 75,
    previousScore = 70,
    diff = 0,
    trend = 'stable',
    breakdown = {}
  } = scoreData;

  const isPositive = diff > 0;
  const isNegative = diff < 0;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Productivity Score
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Weekly Performance Index
          </h3>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
          <span>Formula Verified</span>
        </div>
      </div>

      {/* Main Score Gauge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
            {score}
          </span>
          <span className="text-slate-400 font-semibold text-lg">/ 100</span>
        </div>

        <div className="flex items-center gap-2">
          {isPositive ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
              <TrendingUp className="w-4 h-4" /> +{diff}% vs last week
            </span>
          ) : isNegative ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-bold">
              <TrendingDown className="w-4 h-4" /> {diff}% vs last week
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 text-sm font-bold">
              <Minus className="w-4 h-4" /> Stable vs last week
            </span>
          )}
        </div>
      </div>

      {/* Score Breakdown Factors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Score Component Breakdown</span>
          <span>Target: 100%</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Completion Rate Factor */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Task Completion (35%)
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {breakdown.completionRate || 0}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${breakdown.completionRate || 0}%` }}
              />
            </div>
          </div>

          {/* Time Accuracy Factor */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Time Estimation Accuracy (25%)
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {breakdown.timeAccuracy || 0}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${breakdown.timeAccuracy || 0}%` }}
              />
            </div>
          </div>

          {/* Priority Adherence Factor */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                High Priority Focus (15%)
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {breakdown.priorityAdherence || 0}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full"
                style={{ width: `${breakdown.priorityAdherence || 0}%` }}
              />
            </div>
          </div>

          {/* Consistency & Streak Factor */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Consistency Streak (15%)
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {breakdown.consistencyRate || 0}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${breakdown.consistencyRate || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
