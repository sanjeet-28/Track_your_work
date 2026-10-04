import { useState, useMemo } from 'react';
import { formatDatePretty } from '../../utils/dateFormats';

export function HeatmapGrid({ heatmapData }) {
  const [metric, setMetric] = useState('hours'); // 'hours' | 'tasks' | 'sessions'
  const [hoveredDay, setHoveredDay] = useState(null);

  const year = heatmapData?.year || new Date().getFullYear();
  const daysList = heatmapData?.days || [];

  // Index days by date string "YYYY-MM-DD"
  const dayMap = useMemo(() => {
    const map = {};
    daysList.forEach((d) => {
      map[d.date] = d;
    });
    return map;
  }, [daysList]);

  // Generate 52 weeks (365 days) grid for the year
  const weeks = useMemo(() => {
    const res = [];
    const startDate = new Date(year, 0, 1);
    // Align to Sunday
    const startDay = startDate.getDay();
    const cur = new Date(startDate);
    cur.setDate(cur.getDate() - startDay);

    const endDate = new Date(year, 11, 31);

    while (cur <= endDate || res.length < 52) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const dayStr = String(cur.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${dayStr}`;

        const dataItem = dayMap[dateStr] || {
          date: dateStr,
          completedTasks: 0,
          totalTasks: 0,
          hours: 0,
          sessions: 0,
          intensity: 0
        };

        week.push(dataItem);
        cur.setDate(cur.getDate() + 1);
      }
      res.push(week);
      if (cur.getFullYear() > year && res.length >= 52) break;
    }
    return res;
  }, [year, dayMap]);

  // Color intensities based on selected metric
  const getCellColor = (day) => {
    let val = 0;
    if (metric === 'hours') val = day.hours;
    else if (metric === 'tasks') val = day.completedTasks;
    else val = day.sessions;

    if (val === 0) return 'bg-slate-100 dark:bg-slate-800/80 border-slate-200/40 dark:border-slate-800';

    if (metric === 'hours') {
      if (val >= 5) return 'bg-emerald-600 dark:bg-emerald-500 border-emerald-700';
      if (val >= 3) return 'bg-emerald-500 dark:bg-emerald-600 border-emerald-600';
      if (val >= 1.5) return 'bg-emerald-400 dark:bg-emerald-700 border-emerald-500';
      return 'bg-emerald-200 dark:bg-emerald-900 border-emerald-300';
    } else if (metric === 'tasks') {
      if (val >= 5) return 'bg-indigo-600 dark:bg-indigo-500 border-indigo-700';
      if (val >= 3) return 'bg-indigo-500 dark:bg-indigo-600 border-indigo-600';
      if (val >= 2) return 'bg-indigo-400 dark:bg-indigo-700 border-indigo-500';
      return 'bg-indigo-200 dark:bg-indigo-900 border-indigo-300';
    } else {
      if (val >= 4) return 'bg-violet-600 dark:bg-violet-500 border-violet-700';
      if (val >= 2) return 'bg-violet-500 dark:bg-violet-600 border-violet-600';
      if (val >= 1) return 'bg-violet-300 dark:bg-violet-800 border-violet-400';
      return 'bg-violet-100 dark:bg-violet-950 border-violet-200';
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
      {/* Header and Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Annual Activity
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Productivity Heatmap ({year})
          </h3>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetric('hours')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              metric === 'hours'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Working Hours
          </button>
          <button
            type="button"
            onClick={() => setMetric('tasks')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              metric === 'tasks'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Completed Tasks
          </button>
          <button
            type="button"
            onClick={() => setMetric('sessions')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              metric === 'sessions'
                ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Work Sessions
          </button>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1 min-w-[760px]">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day, dIdx) => (
                <div
                  key={dIdx}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-3.5 h-3.5 rounded-xs border transition-transform hover:scale-125 cursor-pointer ${getCellColor(
                    day
                  )}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Legend & Hover Tooltip */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div>
          {hoveredDay ? (
            <span className="font-medium text-slate-800 dark:text-slate-200">
              <strong className="font-mono text-indigo-600 dark:text-indigo-400">
                {metric === 'hours'
                  ? `${hoveredDay.hours} hours`
                  : metric === 'tasks'
                  ? `${hoveredDay.completedTasks} tasks completed`
                  : `${hoveredDay.sessions} work sessions`}
              </strong>{' '}
              on {formatDatePretty(hoveredDay.date)}
            </span>
          ) : (
            <span>Hover over any day to inspect productivity details</span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span className="w-3 h-3 rounded-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <span className="w-3 h-3 rounded-xs bg-emerald-200 dark:bg-emerald-900" />
          <span className="w-3 h-3 rounded-xs bg-emerald-400 dark:bg-emerald-700" />
          <span className="w-3 h-3 rounded-xs bg-emerald-500 dark:bg-emerald-600" />
          <span className="w-3 h-3 rounded-xs bg-emerald-600 dark:bg-emerald-500" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
