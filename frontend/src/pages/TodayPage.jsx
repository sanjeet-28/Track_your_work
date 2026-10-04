import { Clock, Sparkles, Plus } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { TaskCard } from '../components/tasks/TaskCard';
import { QuickAddTaskBar } from '../components/tasks/QuickAddTaskBar';
import { EmptyState } from '../components/common/EmptyState';
import { formatFullDate, getTodayDateStr } from '../utils/dateFormats';
import { Button } from '../components/common/Button';

export function TodayPage() {
  const { tasks, openTaskModal } = useTasks();

  const today = getTodayDateStr();
  const todayTasks = tasks
    .filter((t) => t.date === today)
    .sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));

  const completedCount = todayTasks.filter((t) => t.status === 'COMPLETED').length;
  const totalCount = todayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Date Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
            Focus Mode
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            {formatFullDate(today)}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Prioritize your agenda and track uninterrupted deep work.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => openTaskModal(null, { date: today })}
        >
          Add Task
        </Button>
      </div>

      {/* Progress Bar Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Today's Progress
          </span>
          <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {progressPercent}%
          </span>
        </div>

        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${Math.min(100, Math.max(progressPercent, totalCount > 0 ? 5 : 0))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {completedCount} of {totalCount} tasks completed
          </span>
          <span>{totalCount - completedCount} tasks remaining</span>
        </div>
      </div>

      {/* Quick Add Bar */}
      <QuickAddTaskBar defaultDate={today} />

      {/* Timeline Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>Schedule Timeline</span>
          </h3>
        </div>

        {todayTasks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <EmptyState
              icon={Sparkles}
              title="No work scheduled for today"
              description="Get started by quickly adding tasks for your day."
              actionLabel="+ Add First Task"
              onAction={() => openTaskModal(null, { date: today })}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
