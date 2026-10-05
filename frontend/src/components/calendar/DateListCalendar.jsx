import { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, Plus, ChevronUp, ChevronDown, Sparkles, Clock, Target } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { getTodayDateStr } from '../../utils/dateFormats';
import { TaskCard } from '../tasks/TaskCard';

/**
 * Format a YYYY-MM-DD string to "23 November 2026"
 */
function formatDateFull(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-US', { month: 'long' });
  const year = dateObj.getFullYear();
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  return {
    full: `${day} ${month} ${year}`,
    weekday,
    day,
    month,
    year
  };
}

/**
 * Converts Date object to local "YYYY-MM-DD"
 */
function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DateListCalendar() {
  const { tasks, openTaskModal } = useTasks();
  const [futureDaysCount, setFutureDaysCount] = useState(30);
  const [pastDaysCount, setPastDaysCount] = useState(30);

  const todayStr = useMemo(() => getTodayDateStr(), []);
  const todayRef = useRef(null);
  const containerRef = useRef(null);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      if (!task.date) return;
      if (!map[task.date]) map[task.date] = [];
      map[task.date].push(task);
    });
    return map;
  }, [tasks]);

  // Construct dates list:
  // Upcoming dates are ABOVE the current date (scrolling UP moves further into the future).
  // Current date is in the middle.
  // Past dates are BELOW the current date (scrolling DOWN moves further into the past).
  const dates = useMemo(() => {
    const list = [];
    const today = new Date();

    // 1. Future dates: from furthest future (+futureDaysCount) down to +1
    for (let i = futureDaysCount; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const str = toDateStr(d);
      list.push({
        dateStr: str,
        isToday: false,
        isFuture: true,
        daysDiff: i
      });
    }

    // 2. Today: current date
    list.push({
      dateStr: todayStr,
      isToday: true,
      isFuture: false,
      daysDiff: 0
    });

    // 3. Past dates: from -1 down to furthest past (-pastDaysCount)
    for (let i = 1; i <= pastDaysCount; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const str = toDateStr(d);
      list.push({
        dateStr: str,
        isToday: false,
        isFuture: false,
        daysDiff: -i
      });
    }

    return list;
  }, [futureDaysCount, pastDaysCount, todayStr]);

  // Center on current date when Calendar opens
  useEffect(() => {
    const timer = setTimeout(() => {
      if (todayRef.current) {
        todayRef.current.scrollIntoView({
          behavior: 'auto',
          block: 'center'
        });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const scrollToToday = () => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  return (
    <div className="relative space-y-4">
      {/* Top Floating / Sticky Control Bar */}
      <div className="sticky top-16 z-20 flex items-center justify-between p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Timeline Calendar
            </h2>
            <p className="text-[11px] text-slate-400">
              Vertical chronological stream • Scroll up for future, scroll down for past
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={scrollToToday}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-800/50"
            title="Focus current date"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

          <button
            type="button"
            onClick={() => openTaskModal(null, { date: todayStr })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>
      </div>

      {/* Main Vertical Date-List Container */}
      <div ref={containerRef} className="space-y-4">
        {/* Top Button: Load next 20 future dates */}
        <div className="flex justify-center py-2">
          <button
            type="button"
            onClick={() => setFutureDaysCount((prev) => prev + 20)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-xs font-bold transition-all shadow-xs cursor-pointer group"
          >
            <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            <span>Load next 20</span>
          </button>
        </div>

        {/* Date Items Stream */}
        <div className="space-y-4">
          {dates.map((item) => {
            const dateTasks = tasksByDate[item.dateStr] || [];
            const { full, weekday } = formatDateFull(item.dateStr);

            return (
              <div
                key={item.dateStr}
                ref={item.isToday ? todayRef : null}
                className={`transition-all duration-200 rounded-2xl ${
                  item.isToday
                    ? 'p-5 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-indigo-950/20 border-2 border-indigo-500 shadow-md shadow-indigo-500/10 ring-4 ring-indigo-500/10'
                    : 'p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Date Header Row */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-base md:text-lg font-bold tracking-tight ${
                        item.isToday
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {full}
                    </span>

                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      {weekday}
                    </span>

                    {item.isToday && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                        <Sparkles className="w-3 h-3" /> Today
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                      {dateTasks.length} {dateTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                    <button
                      type="button"
                      onClick={() => openTaskModal(null, { date: item.dateStr })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={`Add task for ${full}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tasks List for Date */}
                {dateTasks.length === 0 ? (
                  <div className="py-3 px-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-xs italic text-slate-400 dark:text-slate-500">
                      No work
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {dateTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Button: Load next 20 previous dates */}
        <div className="flex justify-center py-4">
          <button
            type="button"
            onClick={() => setPastDaysCount((prev) => prev + 20)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-xs font-bold transition-all shadow-xs cursor-pointer group"
          >
            <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
            <span>Load next 20</span>
          </button>
        </div>
      </div>
    </div>
  );
}
