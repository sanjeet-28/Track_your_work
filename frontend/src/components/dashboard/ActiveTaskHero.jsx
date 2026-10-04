import { useState } from 'react';
import { Play, Square, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { useTimer } from '../../context/TimerContext';
import { useTasks } from '../../context/TaskContext';
import { PriorityBadge, CategoryBadge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatSecondsToTimer, formatDuration } from '../../utils/dateFormats';

export function ActiveTaskHero() {
  const { activeSession, activeTask, elapsedSeconds, stopTimer, startTimer } = useTimer();
  const { tasks, openDetailModal } = useTasks();
  const [busy, setBusy] = useState(false);

  // If no active task running, find the highest priority pending task for today
  const pendingTasks = tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS');
  const nextUpTask = activeTask || pendingTasks[0] || null;

  if (!nextUpTask) {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              All caught up!
            </h4>
            <p className="text-xs text-slate-400">
              No tasks currently pending. Enjoy your break or schedule new work.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isRunning = Boolean(activeSession && activeSession.taskId === nextUpTask.id);

  const handleTimerAction = async () => {
    setBusy(true);
    try {
      if (isRunning) {
        await stopTimer(nextUpTask.id);
      } else {
        await startTimer(nextUpTask.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={() => openDetailModal(nextUpTask)}
      className={`p-5 rounded-2xl border transition-all duration-200 shadow-xs cursor-pointer ${
        isRunning
          ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border-emerald-500/40 ring-4 ring-emerald-500/5'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-400'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isRunning
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 animate-pulse'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              {isRunning ? '● Currently Working' : 'Up Next'}
            </span>

            {nextUpTask.category && <CategoryBadge category={nextUpTask.category} size="xs" />}
            <PriorityBadge priority={nextUpTask.priority} size="xs" />
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
            {nextUpTask.title}
          </h3>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {nextUpTask.startTime && (
              <span className="font-mono">
                {nextUpTask.startTime} {nextUpTask.endTime ? `— ${nextUpTask.endTime}` : ''}
              </span>
            )}
            {nextUpTask.estimatedDuration > 0 && (
              <span>Est: {formatDuration(nextUpTask.estimatedDuration)}</span>
            )}
            {nextUpTask.actualDuration > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Worked: {formatDuration(nextUpTask.actualDuration)}
              </span>
            )}
          </div>
        </div>

        {/* Right Timer Widget */}
        <div
          className="flex items-center gap-4 self-end sm:self-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block uppercase font-medium">
              Timer
            </span>
            <span className="text-xl font-mono font-bold text-slate-900 dark:text-white">
              {isRunning ? formatSecondsToTimer(elapsedSeconds) : '00:00:00'}
            </span>
          </div>

          <Button
            variant={isRunning ? 'danger' : 'primary'}
            size="md"
            icon={isRunning ? Square : Play}
            onClick={handleTimerAction}
            loading={busy}
            className="shadow-sm"
          >
            {isRunning ? 'Stop Work' : 'Start Work'}
          </Button>
        </div>
      </div>
    </div>
  );
}
