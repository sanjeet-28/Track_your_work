import { useState, useEffect } from 'react';
import { AlertTriangle, Check, Calendar, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { taskApi } from '../../services/api';
import { formatDatePretty } from '../../utils/dateFormats';

export function OverdueBanner() {
  const { updateStatus, openRescheduleModal, deleteTask } = useTasks();
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const fetchOverdue = async () => {
    try {
      const res = await taskApi.getOverdue();
      if (res.data) setOverdueTasks(res.data);
    } catch (err) {
      console.error('Error fetching overdue tasks:', err);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, []);

  if (overdueTasks.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/20 shadow-xs overflow-hidden">
      {/* Banner Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
              {overdueTasks.length} Overdue {overdueTasks.length === 1 ? 'Task' : 'Tasks'}
            </h4>
            <p className="text-xs text-amber-800/80 dark:text-amber-400/80">
              These items need your attention. Complete them or reschedule to today.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-900 dark:text-amber-300 hover:bg-amber-100/50 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>{expanded ? 'Hide' : 'Review'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded List */}
      {expanded && (
        <div className="p-4 pt-0 space-y-2 border-t border-amber-200/60 dark:border-amber-900/40">
          {overdueTasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60 text-xs gap-3 flex-wrap sm:flex-nowrap"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={async () => {
                    await updateStatus(t.id, 'COMPLETED');
                    setOverdueTasks((prev) => prev.filter((item) => item.id !== t.id));
                  }}
                  className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 flex items-center justify-center flex-shrink-0 cursor-pointer"
                  title="Mark Complete"
                >
                  <Check className="w-3 h-3 text-emerald-600" />
                </button>

                <div className="truncate">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                    {t.title}
                  </span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    Scheduled for {formatDatePretty(t.date)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => openRescheduleModal(t)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-medium text-[11px] flex items-center gap-1 transition-colors"
                >
                  <Calendar className="w-3 h-3" /> Reschedule
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await deleteTask(t.id);
                    setOverdueTasks((prev) => prev.filter((item) => item.id !== t.id));
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
