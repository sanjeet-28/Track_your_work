import { useState, useMemo } from 'react';
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
  Repeat,
  X,
  Loader2
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useTimer } from '../../context/TimerContext';
import { PriorityBadge, CategoryBadge } from '../common/Badge';
import {
  formatTime12hPadded,
  calculateTimeDifference,
  formatDuration,
  getTodayDateStr
} from '../../utils/dateFormats';

export function CalendarTaskCard({ task, onTimeUpdated }) {
  const {
    updateStatus,
    updateTask,
    openTaskModal,
    openDetailModal,
    openRescheduleModal,
    duplicateTask,
    deleteTask
  } = useTasks();

  const { isActive, startTimer, stopTimer } = useTimer();

  const [showMenu, setShowMenu] = useState(false);
  const [timerBusy, setTimerBusy] = useState(false);

  // Inline time editing state
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [savingTime, setSavingTime] = useState(false);
  const [timeError, setTimeError] = useState('');

  const isCompleted = task.status === 'COMPLETED';
  const isRunning = isActive(task.id);
  const today = getTodayDateStr();
  const isOverdue = task.date < today && !isCompleted && task.status !== 'CANCELLED';

  // Calculate duration directly from endTime - startTime
  const totalDuration = useMemo(() => {
    return calculateTimeDifference(task.startTime, task.endTime);
  }, [task.startTime, task.endTime]);

  // Live preview duration while user is in inline edit mode
  const previewDuration = useMemo(() => {
    if (!editStartTime || !editEndTime) return null;
    return calculateTimeDifference(editStartTime, editEndTime);
  }, [editStartTime, editEndTime]);

  // Handle status checkbox toggle
  const handleToggleStatus = (e) => {
    e.stopPropagation();
    updateStatus(task.id, isCompleted ? 'TODO' : 'COMPLETED');
  };

  // Handle timer start/stop
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
      console.error('Failed to toggle timer:', err);
    } finally {
      setTimerBusy(false);
    }
  };

  // Enter inline time edit mode on double-click
  const handleTimeDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditingTime(true);
    setEditStartTime(task.startTime || '09:00');
    setEditEndTime(task.endTime || '10:00');
    setTimeError('');
  };

  // Save inline time edit
  const handleSaveTime = async (e) => {
    if (e) e.stopPropagation();

    // Validate: end time must not be before start time
    if (editStartTime && editEndTime) {
      const [sh, sm] = editStartTime.split(':').map(Number);
      const [eh, em] = editEndTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;

      if (endMin < startMin) {
        setTimeError('End time cannot be earlier than start time');
        return;
      }
    }

    setSavingTime(true);
    try {
      const updated = await updateTask(task.id, {
        startTime: editStartTime || null,
        endTime: editEndTime || null
      });

      if (onTimeUpdated && updated) {
        onTimeUpdated(updated);
      }

      setIsEditingTime(false);
      setTimeError('');
    } catch (err) {
      setTimeError(err.message || 'Failed to save time');
    } finally {
      setSavingTime(false);
    }
  };

  // Cancel inline time edit
  const handleCancelTime = (e) => {
    if (e) e.stopPropagation();
    setIsEditingTime(false);
    setTimeError('');
  };

  // Formatted display for time range
  const displayTimeRange = useMemo(() => {
    if (task.startTime && task.endTime) {
      return `${formatTime12hPadded(task.startTime)} - ${formatTime12hPadded(task.endTime)}`;
    }
    if (task.startTime) {
      return formatTime12hPadded(task.startTime);
    }
    return '--:--';
  }, [task.startTime, task.endTime]);

  return (
    <div
      onClick={() => openDetailModal(task)}
      className={`group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none max-w-2xl w-full ${
        isRunning
          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-600/60 shadow-xs'
          : isCompleted
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
          : isOverdue
          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-700/60 shadow-xs'
          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:shadow-xs'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Checkbox (Complete / Reopen) */}
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

        {/* Task Body */}
        <div className="flex-1 min-w-0">
          {/* Top Row: <course> <tag> <priority> + subtle status + actions */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Course */}
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

              {/* Tag / Task Type */}
              {(task.taskType || task.category) && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 uppercase tracking-wide">
                  {task.taskType || task.category?.name}
                </span>
              )}

              {/* Priority */}
              <PriorityBadge priority={task.priority} size="xs" />

              {/* Subtle Completed Badge (no strikethrough) */}
              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <Check className="w-3 h-3 stroke-[3]" /> Completed
                </span>
              )}

              {/* Overdue */}
              {isOverdue && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                  <AlertTriangle className="w-3 h-3" /> Overdue
                </span>
              )}

              {/* Recurring */}
              {task.isRecurring && (
                <span className="inline-flex items-center text-[10px] text-indigo-500" title="Recurring Task">
                  <Repeat className="w-3 h-3" />
                </span>
              )}
            </div>

            {/* Top-Right Quick Actions: Timer & Options Menu */}
            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
                  {isRunning ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                </button>
              )}

              {/* Options Menu Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="More options"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
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

          {/* Main Row: <task name> on left  |  <start> - <end>   <total> on right */}
          <div className="flex items-center justify-between gap-3 mt-1.5">
            {/* Task Name - cleanly readable, NO strikethrough */}
            <h4
              className={`text-sm md:text-base font-semibold leading-snug truncate pr-2 ${
                isCompleted
                  ? 'text-slate-700 dark:text-slate-300'
                  : 'text-slate-900 dark:text-white'
              }`}
              title={task.title}
            >
              {task.title}
            </h4>

            {/* Time & Duration: Direct inline edit mode on double click */}
            {isEditingTime ? (
              <div
                className="flex items-center gap-1.5 flex-shrink-0 bg-slate-50 dark:bg-slate-800/90 p-1 rounded-lg border border-indigo-400 dark:border-indigo-500 shadow-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => {
                    setEditStartTime(e.target.value);
                    setTimeError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTime(e);
                    if (e.key === 'Escape') handleCancelTime(e);
                  }}
                  className="px-1.5 py-0.5 text-xs font-mono font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  title="Start Time"
                  autoFocus
                />
                <span className="text-slate-400 font-bold text-xs">-</span>
                <input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => {
                    setEditEndTime(e.target.value);
                    setTimeError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTime(e);
                    if (e.key === 'Escape') handleCancelTime(e);
                  }}
                  className="px-1.5 py-0.5 text-xs font-mono font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  title="End Time"
                />

                {previewDuration && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded border border-indigo-200 dark:border-indigo-800/60">
                    {previewDuration}
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleSaveTime}
                  disabled={savingTime}
                  className="p-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                  title="Save time (Enter)"
                >
                  {savingTime ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancelTime}
                  disabled={savingTime}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Cancel (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onDoubleClick={handleTimeDoubleClick}
                className="flex items-center gap-2 flex-shrink-0 cursor-pointer group/time hover:opacity-85 select-none"
                title="Double-click to edit start & end time"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover/time:text-indigo-500 transition-colors" />
                <span className="text-xs sm:text-sm font-bold font-mono tracking-tight text-slate-800 dark:text-slate-100 group-hover/time:text-indigo-600 dark:group-hover/time:text-indigo-400 transition-colors">
                  {displayTimeRange}
                </span>
                {totalDuration && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs">
                    {totalDuration}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Validation error display for inline edit */}
          {isEditingTime && timeError && (
            <div className="mt-1 text-right">
              <span className="text-[11px] font-semibold text-rose-500">
                {timeError}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
