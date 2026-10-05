import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Calendar, Plus, ChevronUp, ChevronDown, Sparkles, Clock, Target, Loader2 } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { taskApi } from '../../services/api';
import { getTodayDateStr, addDays } from '../../utils/dateFormats';
import { CalendarTaskCard } from './CalendarTaskCard';

/**
 * Format a YYYY-MM-DD string to "25 November 2026"
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

export function DateListCalendar() {
  const { tasks: contextTasks, openTaskModal } = useTasks();

  // Date range state:
  // Initially: 10 future days, today, 10 past days
  const [futureDaysCount, setFutureDaysCount] = useState(10);
  const [pastDaysCount, setPastDaysCount] = useState(10);

  // Local task cache map: { [taskId]: task }
  const [calendarTasksMap, setCalendarTasksMap] = useState({});

  // Loading states
  const [loadingFuture, setLoadingFuture] = useState(false);
  const [loadingPast, setLoadingPast] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Set of dates already fetched to prevent duplicate network calls
  const fetchedDatesSetRef = useRef(new Set());

  const todayStr = useMemo(() => getTodayDateStr(), []);
  const todayRef = useRef(null);
  const containerRef = useRef(null);
  const hasCenteredTodayRef = useRef(false);

  /**
   * Fetch tasks for a specific date range and merge into calendarTasksMap
   */
  const fetchDateRangeTasks = useCallback(async (startDate, endDate) => {
    try {
      const res = await taskApi.getTasks({ startDate, endDate });
      if (res.data) {
        setCalendarTasksMap((prev) => {
          const next = { ...prev };
          res.data.forEach((task) => {
            if (task && task.id) {
              next[task.id] = task;
            }
          });
          return next;
        });
      }
    } catch (err) {
      console.error(`Failed to fetch tasks for range ${startDate} to ${endDate}:`, err);
    }
  }, []);

  /**
   * Initial load: past 10 days, today, future 10 days
   */
  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      const startDate = addDays(todayStr, -10);
      const endDate = addDays(todayStr, 10);

      // Mark all initial dates as fetched
      for (let i = -10; i <= 10; i++) {
        fetchedDatesSetRef.current.add(addDays(todayStr, i));
      }

      setInitialLoading(true);
      await fetchDateRangeTasks(startDate, endDate);
      if (isMounted) {
        setInitialLoading(false);
      }
    }

    loadInitial();
    return () => {
      isMounted = false;
    };
  }, [todayStr, fetchDateRangeTasks]);

  /**
   * Automatically scroll today into center/focus on mount
   */
  useEffect(() => {
    if (!initialLoading && todayRef.current && !hasCenteredTodayRef.current) {
      hasCenteredTodayRef.current = true;
      todayRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'center'
      });
    }
  }, [initialLoading]);

  /**
   * Load next 10 future dates
   * Range: from (futureDaysCount + 1) to (futureDaysCount + 10)
   */
  const handleLoadFuture = async () => {
    if (loadingFuture) return;
    setLoadingFuture(true);

    const newStartOffset = futureDaysCount + 1;
    const newEndOffset = futureDaysCount + 10;
    const startDate = addDays(todayStr, newStartOffset);
    const endDate = addDays(todayStr, newEndOffset);

    // Record scroll metrics before prepending to prevent visual jumping
    const container = containerRef.current || document.documentElement;
    const prevScrollHeight = container.scrollHeight;
    const prevScrollTop = container.scrollTop || window.scrollY;

    // Mark dates as fetched
    for (let i = newStartOffset; i <= newEndOffset; i++) {
      fetchedDatesSetRef.current.add(addDays(todayStr, i));
    }

    await fetchDateRangeTasks(startDate, endDate);

    setFutureDaysCount((prev) => prev + 10);
    setLoadingFuture(false);

    // Smoothly maintain scroll position after DOM prepend
    requestAnimationFrame(() => {
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - prevScrollHeight;
      if (heightDifference > 0) {
        if (containerRef.current) {
          containerRef.current.scrollTop = prevScrollTop + heightDifference;
        } else {
          window.scrollTo(0, prevScrollTop + heightDifference);
        }
      }
    });
  };

  /**
   * Load next 10 past dates
   * Range: from -(pastDaysCount + 10) to -(pastDaysCount + 1)
   */
  const handleLoadPast = async () => {
    if (loadingPast) return;
    setLoadingPast(true);

    const newStartOffset = pastDaysCount + 1;
    const newEndOffset = pastDaysCount + 10;
    const startDate = addDays(todayStr, -newEndOffset);
    const endDate = addDays(todayStr, -newStartOffset);

    // Mark dates as fetched
    for (let i = newStartOffset; i <= newEndOffset; i++) {
      fetchedDatesSetRef.current.add(addDays(todayStr, -i));
    }

    await fetchDateRangeTasks(startDate, endDate);

    setPastDaysCount((prev) => prev + 10);
    setLoadingPast(false);
  };

  /**
   * Merge local range tasks with context tasks to stay 100% reactive to mutations
   * (e.g. create, update, delete, status toggle, reschedule)
   */
  const effectiveTasksMap = useMemo(() => {
    const map = { ...calendarTasksMap };
    // Synchronize with any task changes from TaskContext
    if (Array.isArray(contextTasks)) {
      contextTasks.forEach((task) => {
        if (task && task.id) {
          // If task exists in calendar or falls within the loaded date range
          map[task.id] = task;
        }
      });
    }
    return map;
  }, [calendarTasksMap, contextTasks]);

  /**
   * Handle task update (e.g. from inline time editing)
   */
  const handleTaskUpdated = useCallback((updatedTask) => {
    if (!updatedTask || !updatedTask.id) return;
    setCalendarTasksMap((prev) => ({
      ...prev,
      [updatedTask.id]: updatedTask
    }));
  }, []);

  /**
   * Group tasks by local date string YYYY-MM-DD into INCOMPLETE and COMPLETED sections,
   * with both sections sorted by startTime ascending.
   */
  const tasksByDate = useMemo(() => {
    const grouped = {};
    Object.values(effectiveTasksMap).forEach((task) => {
      if (!task || !task.date) return;
      if (!grouped[task.date]) {
        grouped[task.date] = { incomplete: [], completed: [] };
      }
      if (task.status === 'COMPLETED') {
        grouped[task.date].completed.push(task);
      } else {
        grouped[task.date].incomplete.push(task);
      }
    });

    const sortByStartTime = (a, b) => {
      // If one has start time and the other doesn't, tasks with start time come first
      if (a.startTime && !b.startTime) return -1;
      if (!a.startTime && b.startTime) return 1;
      if (a.startTime && b.startTime) {
        const comp = a.startTime.localeCompare(b.startTime);
        if (comp !== 0) return comp;
        if (a.endTime && b.endTime) {
          const endComp = a.endTime.localeCompare(b.endTime);
          if (endComp !== 0) return endComp;
        }
      }
      return (a.title || '').localeCompare(b.title || '');
    };

    // Sort incomplete and completed tasks on each date by startTime asc
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].incomplete.sort(sortByStartTime);
      grouped[dateKey].completed.sort(sortByStartTime);
    });

    return grouped;
  }, [effectiveTasksMap]);

  /**
   * Construct vertical date list:
   * 1. Future dates: from +futureDaysCount down to +1 (UP is future)
   * 2. Today: 0 (MIDDLE, in focus)
   * 3. Past dates: from -1 down to -pastDaysCount (DOWN is past)
   */
  const dateList = useMemo(() => {
    const list = [];

    // 1. Future dates: furthest upcoming at the top down to +1
    for (let i = futureDaysCount; i >= 1; i--) {
      const dateStr = addDays(todayStr, i);
      list.push({
        dateStr,
        isToday: false,
        isFuture: true,
        daysOffset: i
      });
    }

    // 2. Today: current date in center
    list.push({
      dateStr: todayStr,
      isToday: true,
      isFuture: false,
      daysOffset: 0
    });

    // 3. Past dates: -1 down to furthest past
    for (let i = 1; i <= pastDaysCount; i++) {
      const dateStr = addDays(todayStr, -i);
      list.push({
        dateStr,
        isToday: false,
        isFuture: false,
        daysOffset: -i
      });
    }

    return list;
  }, [futureDaysCount, pastDaysCount, todayStr]);

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
      {/* Top Sticky Control Bar */}
      <div className="sticky top-16 z-20 flex items-center justify-between p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Timeline Calendar
            </h2>
            <p className="text-[11px] text-slate-400">
              Scroll UP for future dates • Scroll DOWN for past dates • Today in center
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={scrollToToday}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-800/50"
            title="Jump to Today"
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
        {/* Top Button: Load next 10 future dates */}
        <div className="flex justify-center py-2">
          <button
            type="button"
            disabled={loadingFuture}
            onClick={handleLoadFuture}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 group"
          >
            {loadingFuture ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            ) : (
              <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            )}
            <span>Load next 10</span>
          </button>
        </div>

        {/* Date Items Stream */}
        <div className="space-y-4">
          {dateList.map((item) => {
            const dateGroup = tasksByDate[item.dateStr] || { incomplete: [], completed: [] };
            const { incomplete, completed } = dateGroup;
            const totalTasks = incomplete.length + completed.length;
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
                      {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
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

                {/* Tasks List for Date - Split into INCOMPLETE and COMPLETED */}
                {totalTasks === 0 ? (
                  <div className="py-3 px-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center max-w-2xl">
                    <p className="text-xs italic text-slate-400 dark:text-slate-500">
                      No work scheduled
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* INCOMPLETE SECTION */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          INCOMPLETE
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {incomplete.length}
                        </span>
                      </div>

                      {incomplete.length === 0 ? (
                        <div className="py-2 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 text-xs text-slate-400 italic max-w-2xl">
                          No incomplete tasks
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {incomplete.map((task) => (
                            <CalendarTaskCard
                              key={task.id}
                              task={task}
                              onTimeUpdated={handleTaskUpdated}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* COMPLETED SECTION (Always displayed BELOW incomplete tasks) */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          COMPLETED
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
                          {completed.length}
                        </span>
                      </div>

                      {completed.length === 0 ? (
                        <div className="py-2 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 text-xs text-slate-400 italic max-w-2xl">
                          No completed tasks
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {completed.map((task) => (
                            <CalendarTaskCard
                              key={task.id}
                              task={task}
                              onTimeUpdated={handleTaskUpdated}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Button: Load next 10 previous dates */}
        <div className="flex justify-center py-4">
          <button
            type="button"
            disabled={loadingPast}
            onClick={handleLoadPast}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 group"
          >
            {loadingPast ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            ) : (
              <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
            )}
            <span>Load next 10</span>
          </button>
        </div>
      </div>
    </div>
  );
}
