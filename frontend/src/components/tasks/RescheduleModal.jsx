import { useState } from 'react';
import { Calendar, ArrowRight, Sun, CalendarDays } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { getTodayDateStr, addDays } from '../../utils/dateFormats';

export function RescheduleModal() {
  const { rescheduleModalState, closeRescheduleModal, rescheduleTask } = useTasks();
  const task = rescheduleModalState.task;
  const [customDate, setCustomDate] = useState(getTodayDateStr());
  const [moving, setMoving] = useState(false);

  if (!task) return null;

  const today = getTodayDateStr();
  const tomorrow = addDays(today, 1);

  // Next Monday
  const d = new Date();
  const day = d.getDay();
  const diffToMon = (8 - day) % 7 || 7;
  const nextMonday = addDays(today, diffToMon);

  const handleMove = async (targetDate) => {
    setMoving(true);
    try {
      await rescheduleTask(task.id, {
        date: targetDate,
        startTime: task.startTime,
        endTime: task.endTime
      });
      closeRescheduleModal();
    } catch (err) {
      console.error(err);
    } finally {
      setMoving(false);
    }
  };

  return (
    <Modal
      isOpen={rescheduleModalState.isOpen}
      onClose={closeRescheduleModal}
      title="Reschedule Work Item"
      subtitle={`Move "${task.title}" to another date`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          {/* Quick Option: Today */}
          <button
            type="button"
            onClick={() => handleMove(today)}
            disabled={moving}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 flex items-center justify-between text-left transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Sun className="w-4 h-4 text-amber-500" />
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Today
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{today}</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Quick Option: Tomorrow */}
          <button
            type="button"
            onClick={() => handleMove(tomorrow)}
            disabled={moving}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 flex items-center justify-between text-left transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Tomorrow
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{tomorrow}</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Quick Option: Next Monday */}
          <button
            type="button"
            onClick={() => handleMove(nextMonday)}
            disabled={moving}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 flex items-center justify-between text-left transition-all"
          >
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4 text-emerald-500" />
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Next Monday
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{nextMonday}</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Custom Date Picker */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Or pick custom date:
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button
              variant="primary"
              size="sm"
              loading={moving}
              onClick={() => handleMove(customDate)}
            >
              Move
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
