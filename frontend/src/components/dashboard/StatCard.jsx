export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'indigo'
}) {
  const colorMap = {
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-indigo-500/10',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/10',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/10',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/10',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/10'
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ring-4 ${colorMap[color] || colorMap.indigo}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
              trend.startsWith('+')
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : trend.startsWith('-')
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <span className="text-xs text-slate-400 mt-1 font-medium block truncate">
          {subtitle}
        </span>
      )}
    </div>
  );
}
