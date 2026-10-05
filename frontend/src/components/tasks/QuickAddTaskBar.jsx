import { useState, useMemo } from 'react';
import { Plus, Sparkles, Calendar, Clock, Tag, Flag } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { parseQuickAddInput } from '../../utils/naturalLanguageParser';
import { formatDatePretty, formatTime12h } from '../../utils/dateFormats';

export function QuickAddTaskBar({ defaultDate }) {
  const { categories, createTask } = useTasks();
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    const res = parseQuickAddInput(input, categories);
    if (defaultDate && !input.toLowerCase().includes('today') && !input.toLowerCase().includes('tomorrow')) {
      res.date = defaultDate;
    }
    return res;
  }, [input, categories, defaultDate]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!parsed || !parsed.title.trim()) return;

    setSubmitting(true);
    try {
      await createTask(parsed);
      setInput('');
      setIsFocused(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      setInput('');
      setIsFocused(false);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative flex items-center bg-white dark:bg-slate-900 border rounded-2xl shadow-sm transition-all duration-200 ${
          isFocused
            ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-md'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div className="pl-4 text-indigo-500">
          <Sparkles className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Quick add: 'COL333 lec 4 tomorrow 10 AM - 11 AM' or 'ELL205 tut 1'..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="w-full py-3.5 px-3 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />

        <div className="pr-2 flex items-center gap-1.5">
          {input.trim() && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Natural Language Parsing Preview */}
      {isFocused && parsed && parsed.title && (
        <div className="mt-2 p-3 bg-indigo-50/60 dark:bg-slate-900/80 border border-indigo-100 dark:border-slate-800 rounded-xl flex flex-wrap items-center gap-2 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Recognized:</span>
          
          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            {parsed.title}
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3 h-3 text-indigo-500" />
            {formatDatePretty(parsed.date)}
          </span>

          {parsed.startTime && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
              <Clock className="w-3 h-3 text-indigo-500" />
              {formatTime12h(parsed.startTime)} {parsed.endTime ? `- ${formatTime12h(parsed.endTime)}` : ''}
            </span>
          )}

          {parsed.priority && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Flag className="w-3 h-3 text-orange-500" />
              {parsed.priority}
            </span>
          )}

          {parsed.tags && parsed.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {parsed.tags.map(t => (
                <span key={t} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-mono text-[10px]">
                  <Tag className="w-2.5 h-2.5" />
                  {t}
                </span>
              ))}
            </div>
          )}

          <span className="ml-auto text-[11px] text-slate-400">
            Press <kbd className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">Enter</kbd> to save
          </span>
        </div>
      )}
    </div>
  );
}
