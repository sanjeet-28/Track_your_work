import { useState, useEffect } from 'react';
import { BookOpenCheck, Star, Calendar, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { reviewApi } from '../services/api';
import { Button } from '../components/common/Button';
import { useTasks } from '../context/TaskContext';
import { getTodayDateStr, formatFullDate } from '../utils/dateFormats';

export function ReviewPage() {
  const { showToast } = useTasks();
  const [tab, setTab] = useState('daily'); // 'daily' | 'weekly'
  const today = getTodayDateStr();

  // Daily review form state
  const [dailyDate, setDailyDate] = useState(today);
  const [dailyData, setDailyData] = useState(null);
  const [rating, setRating] = useState(4);
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatToImprove, setWhatToImprove] = useState('');
  const [tomorrowPriority, setTomorrowPriority] = useState('');
  const [savingDaily, setSavingDaily] = useState(false);

  // Weekly review state
  const [weeklyData, setWeeklyData] = useState(null);
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  // Load Daily Review
  const fetchDaily = async (dStr) => {
    try {
      const res = await reviewApi.getDailyReview(dStr);
      if (res.data) {
        setDailyData(res.data);
        if (res.data.review) {
          setRating(res.data.review.rating || 4);
          setWhatWentWell(res.data.review.whatWentWell || '');
          setWhatToImprove(res.data.review.whatToImprove || '');
          setTomorrowPriority(res.data.review.tomorrowPriority || '');
        } else {
          setWhatWentWell('');
          setWhatToImprove('');
          setTomorrowPriority('');
        }
      }
    } catch (err) {
      console.error('Error fetching daily review:', err);
    }
  };

  // Load Weekly Review
  const fetchWeekly = async () => {
    try {
      setLoadingWeekly(true);
      const res = await reviewApi.getWeeklyReview(today);
      if (res.data) {
        setWeeklyData(res.data);
      }
    } catch (err) {
      console.error('Error fetching weekly review:', err);
    } finally {
      setLoadingWeekly(false);
    }
  };

  useEffect(() => {
    if (tab === 'daily') {
      fetchDaily(dailyDate);
    } else {
      fetchWeekly();
    }
  }, [tab, dailyDate]);

  const handleSaveDaily = async (e) => {
    e.preventDefault();
    setSavingDaily(true);
    try {
      await reviewApi.saveDailyReview({
        date: dailyDate,
        rating,
        whatWentWell,
        whatToImprove,
        tomorrowPriority
      });
      showToast('Daily review saved successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to save review', 'error');
    } finally {
      setSavingDaily(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-indigo-500" />
            <span>Productivity Reviews</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Reflect on your accomplishments, identify improvements, and prepare for tomorrow
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTab('daily')}
            className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
              tab === 'daily'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Daily Reflection
          </button>
          <button
            type="button"
            onClick={() => setTab('weekly')}
            className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
              tab === 'weekly'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Weekly Summary
          </button>
        </div>
      </div>

      {tab === 'daily' ? (
        /* DAILY REVIEW */
        <div className="space-y-6">
          {/* Day Selector & Stats Summary */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Date
                </span>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                  className="mt-1 px-3 py-1.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {dailyData?.stats && (
                <div className="flex items-center gap-4 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="text-slate-400 block">Completed</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {dailyData.stats.completed} / {dailyData.stats.total}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="text-slate-400 block">Planned</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {dailyData.stats.plannedHours}h
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="text-slate-400 block">Actual Logged</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {dailyData.stats.actualHours}h
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reflection Form */}
          <form
            onSubmit={handleSaveDaily}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5"
          >
            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                How would you rate today's focus and productivity?
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Star
                      className={`w-7 h-7 transition-all ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400 scale-105'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* What went well? */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                What went well today?
              </label>
              <textarea
                rows={3}
                placeholder="High focus during morning deep work session, finished DP patterns..."
                value={whatWentWell}
                onChange={(e) => setWhatWentWell(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* What should improve? */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                What could be improved?
              </label>
              <textarea
                rows={3}
                placeholder="Avoid multitasking after lunch, reduce notification interruptions..."
                value={whatToImprove}
                onChange={(e) => setWhatToImprove(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Tomorrow's priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tomorrow's Top Priority:
              </label>
              <input
                type="text"
                placeholder="e.g. Complete system design mock interview"
                value={tomorrowPriority}
                onChange={(e) => setTomorrowPriority(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" loading={savingDaily}>
                Save Daily Reflection
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* WEEKLY REVIEW */
        <div className="space-y-6">
          {loadingWeekly ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading weekly metrics...</div>
          ) : weeklyData ? (
            <div className="space-y-6">
              {/* Weekly Performance Scorecard */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="text-xs text-slate-400 block mb-1">Total Tasks</span>
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {weeklyData.totalTasks}
                  </span>
                  <span className="text-[11px] text-emerald-600 block mt-1">
                    {weeklyData.completedTasks} completed
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="text-xs text-slate-400 block mb-1">Completion Rate</span>
                  <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                    {weeklyData.completionRate}%
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    {weeklyData.comparison?.taskDiff >= 0
                      ? `+${weeklyData.comparison.taskDiff} vs prev week`
                      : `${weeklyData.comparison.taskDiff} vs prev week`}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="text-xs text-slate-400 block mb-1">Total Hours</span>
                  <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {weeklyData.totalHours}h
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Planned: {weeklyData.plannedHours}h
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="text-xs text-slate-400 block mb-1">Daily Average</span>
                  <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
                    {weeklyData.avgHoursPerDay}h
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">per day</span>
                </div>
              </div>

              {/* Highlights: Best Day & Top Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Peak Productivity Day
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {weeklyData.bestDay || 'No data logged'}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Top Category
                  </span>
                  <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                    {weeklyData.topCategory || 'No data logged'}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
