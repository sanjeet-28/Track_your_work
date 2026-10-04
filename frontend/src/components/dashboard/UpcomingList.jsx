import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { taskApi } from '../../services/api';
import { formatDatePretty, formatFullDate } from '../../utils/dateFormats';

export function UpcomingList() {
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskApi
      .getUpcoming(5)
      .then((res) => {
        if (res.data) setUpcoming(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const dates = Object.keys(upcoming).sort();

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span>Upcoming Work (Next 5 Days)</span>
        </h3>
        <button
          type="button"
          onClick={() => navigate('/calendar')}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
        >
          View Calendar <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : dates.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No upcoming tasks scheduled.</p>
      ) : (
        <div className="space-y-2">
          {dates.map((dateStr) => {
            const dayTasks = upcoming[dateStr] || [];
            return (
              <div
                key={dateStr}
                onClick={() => navigate(`/calendar`)}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {formatDatePretty(dateStr)}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {formatFullDate(dateStr)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      dayTasks.length > 0
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
