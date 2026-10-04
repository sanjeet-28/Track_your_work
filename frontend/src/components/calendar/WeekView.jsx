import { useState, useRef } from 'react';
import { useTasks } from '../../context/TaskContext';
import { getWeekDays, formatTime12h, getTodayDateStr } from '../../utils/dateFormats';
import { PriorityBadge } from '../common/Badge';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM (23:00)
const HOUR_HEIGHT = 64; // px per hour

export function WeekView({ currentDate, onDropTask }) {
  const { tasks, openTaskModal, openDetailModal, updateTask } = useTasks();
  const currentStr = currentDate.toISOString().split('T')[0];
  const weekDays = getWeekDays(currentStr, 1);
  const today = getTodayDateStr();

  const [resizingTaskId, setResizingTaskId] = useState(null);

  // Group tasks by date
  const tasksByDate = {};
  tasks.forEach((t) => {
    if (!tasksByDate[t.date]) tasksByDate[t.date] = [];
    tasksByDate[t.date].push(t);
  });

  const handleCellClick = (dateStr, hour) => {
    const timeStr = `${String(hour).padStart(2, '0')}:00`;
    openTaskModal(null, { date: dateStr, startTime: timeStr });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetDate, targetHour) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    if (onDropTask) {
      onDropTask(taskId, targetDate, targetHour ? `${String(targetHour).padStart(2, '0')}:00` : null);
    }
  };

  // Resize handler
  const handleResizeStart = (e, task) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingTaskId(task.id);

    const startY = e.clientY;
    const initialDuration = task.estimatedDuration || 60;

    const handleMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaMins = Math.round((deltaY / HOUR_HEIGHT) * 60 / 15) * 15; // snap to 15 min
      const newDuration = Math.max(15, initialDuration + deltaMins);
      // We can preview if needed
    };

    const handleMouseUp = async (upEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setResizingTaskId(null);

      const deltaY = upEvent.clientY - startY;
      const deltaMins = Math.round((deltaY / HOUR_HEIGHT) * 60 / 15) * 15;
      const newDuration = Math.max(15, initialDuration + deltaMins);

      if (newDuration !== initialDuration && task.startTime) {
        const [sH, sM] = task.startTime.split(':').map(Number);
        const endTotal = sH * 60 + sM + newDuration;
        const endH = Math.floor(endTotal / 60) % 24;
        const endM = endTotal % 60;
        const newEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        await updateTask(task.id, {
          estimatedDuration: newDuration,
          endTime: newEndTime
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden select-none flex flex-col">
      {/* Header with week days */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
        <div className="py-3 text-center text-xs font-semibold text-slate-400 border-r border-slate-200 dark:border-slate-800">
          Time
        </div>
        {weekDays.map((d) => (
          <div
            key={d.date}
            className={`py-2.5 px-1 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${
              d.isToday ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
              {d.dayName}
            </span>
            <span
              className={`text-sm font-bold inline-flex items-center justify-center w-7 h-7 rounded-full mt-0.5 ${
                d.isToday ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-800 dark:text-slate-200'
              }`}
            >
              {d.dayNumber}
            </span>
          </div>
        ))}
      </div>

      {/* Hourly Grid Body */}
      <div className="overflow-y-auto max-h-[680px]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
          {/* Hour labels */}
          <div className="border-r border-slate-200 dark:border-slate-800 select-none">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="text-[11px] font-mono text-slate-400 flex items-start justify-center pt-1 border-b border-slate-100 dark:border-slate-800/60"
              >
                {formatTime12h(`${String(h).padStart(2, '0')}:00`)}
              </div>
            ))}
          </div>

          {/* 7 Day Columns */}
          {weekDays.map((d) => {
            const dayTasks = tasksByDate[d.date] || [];

            return (
              <div
                key={d.date}
                className="relative border-r border-slate-200/80 dark:border-slate-800/80 last:border-r-0"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, d.date)}
              >
                {/* Horizontal hour lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    onClick={() => handleCellClick(d.date, h)}
                    className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 cursor-pointer transition-colors"
                  />
                ))}

                {/* Render Time Blocks */}
                {dayTasks.map((task) => {
                  let top = 0;
                  let height = 48; // default

                  if (task.startTime) {
                    const [sH, sM] = task.startTime.split(':').map(Number);
                    const clampedH = Math.max(6, Math.min(23, sH));
                    top = (clampedH - 6) * HOUR_HEIGHT + (sM / 60) * HOUR_HEIGHT;

                    const durationMins = task.estimatedDuration > 0 ? task.estimatedDuration : 60;
                    height = Math.max(32, (durationMins / 60) * HOUR_HEIGHT);
                  }

                  const isCompleted = task.status === 'COMPLETED';

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', task.id);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailModal(task);
                      }}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: '4px',
                        right: '4px'
                      }}
                      className={`absolute rounded-xl p-2 border shadow-xs transition-all cursor-pointer overflow-hidden flex flex-col justify-between group ${
                        isCompleted
                          ? 'bg-slate-100/90 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 opacity-60 text-slate-500'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 hover:border-indigo-500 hover:shadow-md'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                            {task.startTime || 'Flexible'} {task.endTime ? `— ${task.endTime}` : ''}
                          </span>
                          <PriorityBadge priority={task.priority} size="xs" />
                        </div>

                        <h5 className="font-semibold text-xs truncate leading-tight">
                          {task.title}
                        </h5>
                      </div>

                      {/* Resize Handle at bottom */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, task)}
                        className="h-2 w-full cursor-s-resize hover:bg-indigo-500/30 rounded-b transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                        title="Drag to resize duration"
                      >
                        <div className="w-6 h-0.5 bg-slate-400 rounded-full" />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
