import { Lightbulb, TrendingUp, AlertCircle, CheckCircle2, Award } from 'lucide-react';

export function InsightsList({ insights = [] }) {
  if (!insights || insights.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center text-xs text-slate-400">
        Complete more daily tasks to unlock personalized productivity patterns.
      </div>
    );
  }

  const iconMap = {
    positive: CheckCircle2,
    warning: AlertCircle,
    neutral: TrendingUp,
    info: Lightbulb
  };

  const styleMap = {
    positive: 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
    warning: 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    neutral: 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300',
    info: 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-300'
  };

  return (
    <div className="space-y-3">
      {insights.map((item) => {
        const Icon = iconMap[item.type] || Lightbulb;
        const style = styleMap[item.type] || styleMap.info;

        return (
          <div
            key={item.id || item.title}
            className={`p-4 rounded-2xl border transition-all ${style} flex items-start gap-3.5`}
          >
            <div className="mt-0.5 p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-xs flex-shrink-0">
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h4>
                {item.metric && (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 shadow-2xs">
                    {item.metric}
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {item.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
