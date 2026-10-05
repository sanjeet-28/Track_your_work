import { useState, useEffect } from 'react';
import { Search, Plus, Square } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useTimer } from '../../context/TimerContext';
import { formatSecondsToTimer } from '../../utils/dateFormats';
import { Button } from '../common/Button';

export function Topbar() {
  const { filters, setFilters, openTaskModal } = useTasks();
  const { activeSession, activeTask, elapsedSeconds, stopTimer } = useTimer();
  const [greeting, setGreeting] = useState('');
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const handleStopActive = async () => {
    if (!activeSession) return;
    setStopping(true);
    try {
      await stopTimer(activeSession.taskId);
    } catch (err) {
      console.error(err);
    } finally {
      setStopping(false);
    }
  };

  return (
    <header className="h-16 px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-4">
      {/* Left: Greeting */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{greeting}, Sanjeet</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            Track daily work, stay focused, achieve goals.
          </p>
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search tasks, categories, tags..."
            value={filters.search || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {/* Active Timer Pill */}
        {activeSession && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-xs animate-in fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col text-left max-w-[130px] md:max-w-[180px]">
              <span className="text-[11px] font-semibold truncate leading-tight">
                {activeTask?.title || 'Active Session'}
              </span>
              <span className="text-[10px] font-mono font-medium tracking-tight">
                {formatSecondsToTimer(elapsedSeconds)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleStopActive}
              disabled={stopping}
              className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
              title="Stop work timer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        )}

        {/* Add Work Button */}
        <Button
          onClick={() => openTaskModal()}
          variant="primary"
          size="sm"
          icon={Plus}
          className="shadow-sm shadow-indigo-500/20"
        >
          <span>Add Work</span>
        </Button>
      </div>
    </header>
  );
}
