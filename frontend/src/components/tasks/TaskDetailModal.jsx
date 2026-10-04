import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Play,
  Square,
  Tag,
  CheckCircle2,
  RotateCcw,
  Edit3,
  Trash2,
  Copy,
  CalendarDays,
  Layers
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useTimer } from '../../context/TimerContext';
import { timerApi } from '../../services/api';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../common/Badge';
import {
  formatFullDate,
  formatTime12h,
  formatDuration,
  formatSecondsToTimer
} from '../../utils/dateFormats';

export function TaskDetailModal() {
  const {
    detailModalState,
    closeDetailModal,
    updateStatus,
    openTaskModal,
    openRescheduleModal,
    duplicateTask,
    deleteTask
  } = useTasks();
  const { isActive, startTimer, stopTimer, elapsedSeconds } = useTimer();

  const task = detailModalState.task;
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [timerBusy, setTimerBusy] = useState(false);

  const isRunning = task ? isActive(task.id) : false;
  const isCompleted = task?.status === 'COMPLETED';

  useEffect(() => {
    if (task?.id) {
      setLoadingSessions(true);
      timerApi
        .getSessions(task.id)
        .then((res) => {
          if (res.data) setSessions(res.data);
        })
        .catch(console.error)
        .finally(() => setLoadingSessions(false));
    }
  }, [task?.id, task?.actualDuration, isRunning]);

  if (!task) return null;

  const handleTimerToggle = async () => {
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

  const diffMinutes = (task.actualDuration || 0) - (task.estimatedDuration || 0);

  return (
    <Modal
      isOpen={detailModalState.isOpen}
      onClose={closeDetailModal}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Header with status & priority badges */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={task.status} size="md" />
            <PriorityBadge priority={task.priority} size="md" />
            {task.category && <CategoryBadge category={task.category} size="md" />}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isCompleted ? 'secondary' : 'success'}
              size="sm"
              icon={isCompleted ? RotateCcw : CheckCircle2}
              onClick={() => updateStatus(task.id, isCompleted ? 'TODO' : 'COMPLETED')}
            >
              {isCompleted ? 'Reopen Task' : 'Mark Complete'}
            </Button>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
            {task.title}
          </h2>
          {task.description ? (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {task.description}
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-400 italic">No description provided.</p>
          )}
        </div>

        {/* Scheduled Time & Planned vs Actual Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {formatFullDate(task.date)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span className="font-mono text-slate-700 dark:text-slate-200">
                {task.startTime ? formatTime12h(task.startTime) : 'Flexible'}
                {task.endTime ? ` - ${formatTime12h(task.endTime)}` : ''}
              </span>
            </div>
          </div>

          {/* Time Comparison Card */}
          <div className="space-y-1 sm:border-l sm:border-slate-200 dark:sm:border-slate-700/60 sm:pl-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Planned Duration:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatDuration(task.estimatedDuration)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Actual Logged:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatDuration(task.actualDuration)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500">Difference:</span>
              <span
                className={`font-semibold font-mono ${
                  diffMinutes > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : diffMinutes < 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500'
                }`}
              >
                {diffMinutes > 0 ? `+${diffMinutes}m` : diffMinutes < 0 ? `${diffMinutes}m` : '0m'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Stopwatch Tracker */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isRunning
                  ? 'bg-emerald-500 text-white animate-pulse'
                  : 'bg-indigo-600 text-white shadow-xs'
              }`}
            >
              {isRunning ? <Clock className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {isRunning ? 'Currently Tracking Work' : 'Ready to Work'}
              </span>
              <span className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                {isRunning ? formatSecondsToTimer(elapsedSeconds) : '00:00:00'}
              </span>
            </div>
          </div>

          <Button
            variant={isRunning ? 'danger' : 'primary'}
            size="md"
            icon={isRunning ? Square : Play}
            onClick={handleTimerToggle}
            disabled={timerBusy}
          >
            {isRunning ? 'Stop Work' : 'Start Work'}
          </Button>
        </div>

        {/* Work Sessions History */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Work Sessions History ({sessions.length})
            </h4>
          </div>

          {loadingSessions ? (
            <p className="text-xs text-slate-400">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              No work sessions recorded yet. Click "Start Work" to begin tracking.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sessions.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      Session {sessions.length - idx}:
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono">
                      {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {s.endTime
                        ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Active now'}
                    </span>
                    {s.notes && (
                      <span className="text-slate-400 italic">({s.notes})</span>
                    )}
                  </div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatDuration(s.duration)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              Tags
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map((t) => (
                <span
                  key={t.id || t.name}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono"
                >
                  #{t.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Edit3}
              onClick={() => {
                closeDetailModal();
                openTaskModal(task);
              }}
            >
              Edit
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={CalendarDays}
              onClick={() => {
                closeDetailModal();
                openRescheduleModal(task);
              }}
            >
              Move Date
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={Copy}
              onClick={() => {
                duplicateTask(task.id);
                closeDetailModal();
              }}
            >
              Duplicate
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this task?')) {
                deleteTask(task.id);
                closeDetailModal();
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
