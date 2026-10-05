import { useState, useEffect } from 'react';
import { BarChart2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Sparkles } from 'lucide-react';
import { courseApi } from '../../services/api';
import { getTodayDateStr } from '../../utils/dateFormats';

export function DailyCourseBarGraph() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDailyData = async (dateStr) => {
    try {
      setLoading(true);
      const res = await courseApi.getDailyBreakdown(dateStr);
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching daily course breakdown:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyData(selectedDate);
  }, [selectedDate]);

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    const dateStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    const dateStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  const handleToday = () => {
    setSelectedDate(getTodayDateStr());
  };

  // Format date display (e.g., "5 Oct 2026")
  const [y, m, d] = selectedDate.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

  // Max minutes for scaling bars
  const maxMinutes = data?.courses && data.courses.length > 0
    ? Math.max(...data.courses.map((c) => c.minutes))
    : 1;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
      {/* Header and Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 block">
            Course Distribution
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-500" />
            <span>Daily Course Time Breakdown</span>
          </h3>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>{weekday}, {formattedDate}</span>
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {selectedDate !== getTodayDateStr() && (
            <button
              type="button"
              onClick={handleToday}
              className="ml-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Total Time Summary on Date */}
      {data && data.totalMinutes > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500 dark:text-slate-400">Total Tracked Work Time:</span>
          <span className="font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {data.totalFormatted} ({data.totalHours} hrs)
          </span>
        </div>
      )}

      {/* Bar Graph or Empty State */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading study breakdown...</span>
        </div>
      ) : !data || data.courses.length === 0 ? (
        <div className="py-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-slate-400 mx-auto opacity-70" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            No work recorded for {formattedDate}
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Log time on tasks with course codes (e.g. COL333, ELL205) using the work timer to see your daily distribution.
          </p>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {data.courses.map((course) => {
            const percentage = Math.max(8, Math.round((course.minutes / maxMinutes) * 100));

            return (
              <div key={course.code} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-bold font-mono tracking-tight"
                      style={{
                        backgroundColor: `${course.color}20`,
                        color: course.color,
                        border: `1px solid ${course.color}40`
                      }}
                    >
                      {course.code}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 truncate max-w-[150px] sm:max-w-xs">
                      {course.name !== course.code ? course.name : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {course.formatted}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({course.sessionsCount} {course.sessionsCount === 1 ? 'session' : 'sessions'})
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden flex items-center p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1.5"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: course.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
