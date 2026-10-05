import { Plus } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { getMonthDays, formatTime12h, getTodayDateStr } from '../../utils/dateFormats';

export function MonthView({ currentDate, onDropTask }) {
  const { tasks, openTaskModal, openDetailModal } = useTasks();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const days = getMonthDays(year, month);
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = getTodayDateStr();

  // Group tasks by date
  const tasksByDate = {};
  tasks.forEach((t) => {
    if (!tasksByDate[t.date]) tasksByDate[t.date] = [];
    tasksByDate[t.date].push(t);
  });

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onDropTask) {
      onDropTask(taskId, targetDate);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden select-none">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        {weekdays.map((w) => (
          <div
            key={w}
            className="py-2.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Days matrix */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
        {days.map((d, index) => {
          const dayTasks = tasksByDate[d.date] || [];
          const isToday = d.date === today;

          return (
            <div
              key={index}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, d.date)}
              className={`min-h-[110px] md:min-h-[130px] p-1.5 md:p-2 transition-colors group relative flex flex-col ${
                !d.isCurrentMonth
                  ? 'bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600'
                  : 'bg-white dark:bg-slate-900 hover:bg-indigo-50/30 dark:hover:bg-slate-800/30'
              }`}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {d.dayNumber}
                </span>

                <button
                  type="button"
                  onClick={() => openTaskModal(null, { date: d.date })}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  title="Add task on this day"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Task list inside day cell */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] md:max-h-[105px]">
                {dayTasks.map((task) => {
                  const isCompleted = task.status === 'COMPLETED';
                  const isOverdue = task.date < today && !isCompleted && task.status !== 'CANCELLED';

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
                      className={`px-1.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer truncate flex items-center gap-1 border ${
                        isCompleted
                          ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-transparent'
                          : isOverdue
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                          : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-400'
                      }`}
                      title={`${task.title} ${task.startTime ? `(${formatTime12h(task.startTime)})` : ''}`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: task.category?.color || (isCompleted ? '#94a3b8' : '#6366f1')
                        }}
                      />
                      {task.startTime && (
                        <span className="font-mono text-[9px] opacity-75 flex-shrink-0">
                          {task.startTime}
                        </span>
                      )}
                      <span className="truncate">{task.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
