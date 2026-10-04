import { useTasks } from '../../context/TaskContext';
import { formatFullDate, formatDatePretty } from '../../utils/dateFormats';
import { TaskCard } from '../tasks/TaskCard';
import { EmptyState } from '../common/EmptyState';
import { Calendar } from 'lucide-react';

export function AgendaView() {
  const { tasks, openTaskModal } = useTasks();

  // Group tasks by date
  const grouped = {};
  tasks.forEach((t) => {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  });

  const sortedDates = Object.keys(grouped).sort();

  if (sortedDates.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6">
        <EmptyState
          icon={Calendar}
          title="No scheduled tasks"
          description="Your agenda is clear. Create tasks to organize your upcoming schedule."
          actionLabel="+ Add First Task"
          onAction={() => openTaskModal()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((dateStr) => {
        const dayTasks = grouped[dateStr];

        return (
          <div
            key={dateStr}
            className="p-4 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatDatePretty(dateStr)}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {formatFullDate(dateStr)}
                </span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-300">
                {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dayTasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
