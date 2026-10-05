import { useState } from 'react';
import {
  Check,
  Clock,
  Play,
  Square,
  MoreVertical,
  Calendar,
  AlertTriangle,
  Copy,
  Edit,
  Trash2,
  Repeat
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useTimer } from '../../context/TimerContext';
import { PriorityBadge, CategoryBadge } from '../common/Badge';
import { formatTime12h, formatDuration, getTodayDateStr } from '../../utils/dateFormats';

export function TaskCard({ task, onDragStart }) {
  const { updateStatus, openTaskModal, openDetailModal, openRescheduleModal, duplicateTask, deleteTask } = useTasks();
  const { isActive, startTimer, stopTimer } = useTimer();
  const [showMenu, setShowMenu] = useState(false);
  const [timerBusy, setTimerBusy] = useState(false);

  const isCompleted = task.status === 'COMPLETED';
  const isRunning = isActive(task.id);
  const today = getTodayDateStr();
  const isOverdue = task.date < today && !isCompleted && task.status !== 'CANCELLED';

  const handleToggleStatus = (e) => {
    e.stopPropagation();
    updateStatus(task.id, isCompleted ? 'TODO' : 'COMPLETED');
  };

  const handleTimerClick = async (e) => {
    e.stopPropagation();
    setTimerBusy(true);
    try {
      if (isRunning) {
        await stopTimer(task.id);
      } else {
        await startTimer(task.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimerBusy(false);
    }
  };

  return (
    <div
      onClick={() => openDetailModal(task)}
      draggable={Boolean(onDragStart)}
      onDragStart={(e) => onDragStart && onDragStart(e, task)}
      className={`group relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
        isRunning
          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-600/60 shadow-md shadow-emerald-500/10'
          : isCompleted
          ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-70'
          : isOverdue
          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-700/60 shadow-xs'
          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleToggleStatus}
          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer flex-shrink-0 ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-white dark:bg-slate-800'
          }`}
          title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {task.course && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold tracking-tight shadow-2xs"
                style={{
                  backgroundColor: `${task.course.color}20`,
                  color: task.course.color,
                  border: `1px solid ${task.course.color}40`
                }}
              >
                {task.course.code}
              </span>
            )}
            {task.taskType && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                {task.taskType}
              </span>
            )}
            {task.category && <CategoryBadge category={task.category} size="xs" />}
            <PriorityBadge priority={task.priority} size="xs" />
            
            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                <AlertTriangle className="w-3 h-3" /> Overdue
              </span>
            )}

            {task.isRecurring && (
              <span className="inline-flex items-center text-[10px] text-indigo-500" title="Recurring Task">
                <Repeat className="w-3 h-3" />
              </span>
            )}
          </div>

          <h4
            className={`text-sm font-semibold text-slate-900 dark:text-white leading-snug truncate ${
              isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
            }`}
          >
            {task.title}
          </h4>

          {/* Time & Duration row */}
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            {task.startTime && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatTime12h(task.startTime)}
                {task.endTime ? ` - ${formatTime12h(task.endTime)}` : ''}
              </span>
            )}

            {task.estimatedDuration > 0 && (
              <span className="text-[11px] text-slate-400">
                Est: {formatDuration(task.estimatedDuration)}
              </span>
            )}

            {task.actualDuration > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono">
                Actual: {formatDuration(task.actualDuration)}
              </span>
            )}
          </div>
        </div>

        {/* Right Timer & Menu Actions */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Timer Start/Stop Button */}
          {!isCompleted && (
            <button
              type="button"
              onClick={handleTimerClick}
              disabled={timerBusy}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                isRunning
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs animate-pulse'
                  : 'text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
              title={isRunning ? 'Stop work session' : 'Start work session'}
            >
              {isRunning ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
          )}

          {/* Options Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-30 py-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      openTaskModal(task);
                    }}
                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      openRescheduleModal(task);
                    }}
                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Move Date
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      duplicateTask(task.id);
                    }}
                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      deleteTask(task.id);
                    }}
                    className="w-full px-3 py-1.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
