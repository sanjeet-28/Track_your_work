import { useState, useMemo } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import {
  formatTime12hPadded,
  calculateTimeDifference
} from '../../utils/dateFormats';

export function CalendarTaskCard({ task, onTimeUpdated }) {
  const {
    updateStatus,
    updateTask,
    openDetailModal
  } = useTasks();

  // Inline time editing state
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [savingTime, setSavingTime] = useState(false);
  const [timeError, setTimeError] = useState('');

  const isCompleted = task.status === 'COMPLETED';

  // Calculate duration directly: endTime - startTime
  const totalDuration = useMemo(() => {
    return calculateTimeDifference(task.startTime, task.endTime);
  }, [task.startTime, task.endTime]);

  // Live preview duration while in inline edit mode
  const previewDuration = useMemo(() => {
    if (!editStartTime || !editEndTime) return null;
    return calculateTimeDifference(editStartTime, editEndTime);
  }, [editStartTime, editEndTime]);

  // Toggle completion status
  const handleToggleStatus = (e) => {
    e.stopPropagation();
    updateStatus(task.id, isCompleted ? 'TODO' : 'COMPLETED');
  };

  // Double click time area to enter inline edit
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

    // Validate: end time must be after start time
    if (editStartTime && editEndTime) {
      const [sh, sm] = editStartTime.split(':').map(Number);
      const [eh, em] = editEndTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;

      if (endMin <= startMin) {
        setTimeError('End time must be after start time');
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
      className={`group relative rounded-lg border px-3 py-2 transition-colors duration-150 w-full ${
        isCompleted
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top line: [checkbox] [COURSE] [TAG] [PRIORITY] */}
      <div className="flex items-center gap-2">
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleToggleStatus}
          className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors cursor-pointer flex-shrink-0 ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-white dark:bg-slate-800'
          }`}
          title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
        </button>

        {/* Course */}
        {task.course && (
          <span
            className="inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-bold font-mono tracking-tight"
            style={{
              backgroundColor: `${task.course.color}15`,
              color: task.course.color,
              border: `1px solid ${task.course.color}35`
            }}
          >
            {task.course.code}
          </span>
        )}

        {/* Tag / Task Type */}
        {(task.taskType || task.category) && (
          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {task.taskType || task.category?.name}
          </span>
        )}

        {/* Priority */}
        <span
          className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
            task.priority === 'HIGH' || task.priority === 'URGENT'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
              : task.priority === 'LOW'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
          }`}
        >
          {task.priority || 'MEDIUM'}
        </span>
      </div>

      {/* Main Row: TASK NAME                  START - END   DURATION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mt-1 pl-5.5">
        {/* Task Name - readable normally, NO strikethrough */}
        <span
          onClick={() => openDetailModal(task)}
          className={`text-sm font-medium tracking-tight truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
            isCompleted
              ? 'text-slate-600 dark:text-slate-300'
              : 'text-slate-900 dark:text-white'
          }`}
          title={task.title}
        >
          {task.title}
        </span>

        {/* Time and Duration on right side of same row */}
        {isEditingTime ? (
          <div
            className="flex items-center gap-1.5 flex-shrink-0 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-indigo-400"
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
              className="px-1 py-0.5 text-xs font-mono font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              className="px-1 py-0.5 text-xs font-mono font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            {previewDuration && (
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {previewDuration}
              </span>
            )}

            <button
              type="button"
              onClick={handleSaveTime}
              disabled={savingTime}
              className="p-0.5 text-indigo-600 hover:text-indigo-700 cursor-pointer"
              title="Save (Enter)"
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
              className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Cancel (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            onDoubleClick={handleTimeDoubleClick}
            className="flex items-center gap-2 flex-shrink-0 cursor-pointer select-none group/time"
            title="Double-click to edit time"
          >
            <span className="text-xs sm:text-sm font-semibold font-mono tracking-tight text-slate-800 dark:text-slate-200 group-hover/time:text-indigo-600 dark:group-hover/time:text-indigo-400 transition-colors">
              {displayTimeRange}
            </span>
            {totalDuration && (
              <span className="text-xs sm:text-sm font-semibold font-mono text-slate-500 dark:text-slate-400">
                {totalDuration}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Inline Time Validation Error */}
      {isEditingTime && timeError && (
        <div className="mt-1 text-right text-[11px] font-semibold text-rose-500">
          {timeError}
        </div>
      )}
    </div>
  );
}
