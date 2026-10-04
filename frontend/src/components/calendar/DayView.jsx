import { useTasks } from '../../context/TaskContext';
import { formatTime12h, formatDuration, getTodayDateStr } from '../../utils/dateFormats';
import { TaskCard } from '../tasks/TaskCard';
import { Button } from '../common/Button';
import { Plus, Clock } from 'lucide-react';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM
const HOUR_HEIGHT = 72; // px per hour

export function DayView({ currentDate }) {
  const { tasks, openTaskModal } = useTasks();
  const dateStr = currentDate.toISOString().split('T')[0];
  const today = getTodayDateStr();

  const dayTasks = tasks.filter((t) => t.date === dateStr);

  const handleCellClick = (hour) => {
    const timeStr = `${String(hour).padStart(2, '0')}:00`;
    openTaskModal(null, { date: dateStr, startTime: timeStr });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden select-none">
      {/* Day Overview Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Day Schedule
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => openTaskModal(null, { date: dateStr })}
        >
          Add Task
        </Button>
      </div>

      {/* Hourly Timeline */}
      <div className="overflow-y-auto max-h-[680px]">
        <div className="grid grid-cols-[80px_1fr] relative">
          {/* Time Labels */}
          <div className="border-r border-slate-200 dark:border-slate-800">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="text-xs font-mono text-slate-400 flex items-start justify-center pt-2 border-b border-slate-100 dark:border-slate-800/60"
              >
                {formatTime12h(`${String(h).padStart(2, '0')}:00`)}
              </div>
            ))}
          </div>

          {/* Timeline Lane */}
          <div className="relative">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: `${HOUR_HEIGHT}px` }}
                onClick={() => handleCellClick(h)}
                className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 cursor-pointer transition-colors"
              />
            ))}

            {/* Time Blocks */}
            {dayTasks.map((task) => {
              let top = 0;
              let height = 60;

              if (task.startTime) {
                const [sH, sM] = task.startTime.split(':').map(Number);
                const clampedH = Math.max(6, Math.min(23, sH));
                top = (clampedH - 6) * HOUR_HEIGHT + (sM / 60) * HOUR_HEIGHT;
                const durationMins = task.estimatedDuration > 0 ? task.estimatedDuration : 60;
                height = Math.max(48, (durationMins / 60) * HOUR_HEIGHT);
              }

              return (
                <div
                  key={task.id}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: '12px',
                    right: '12px'
                  }}
                  className="absolute"
                >
                  <TaskCard task={task} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
