import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { ProductivityScoreCard } from '../components/analytics/ProductivityScoreCard';
import { HeatmapGrid } from '../components/analytics/HeatmapGrid';
import { DailyCompletionChart } from '../components/analytics/DailyCompletionChart';
import { PlannedVsActualChart } from '../components/analytics/PlannedVsActualChart';
import { CategoryBreakdownChart } from '../components/analytics/CategoryBreakdownChart';
import { StatCard } from '../components/dashboard/StatCard';

export function AnalyticsPage() {
  const [scoreData, setScoreData] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [categoryData, setCategoryData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const [scoreRes, heatRes, dailyRes, catRes, weekRes] = await Promise.all([
          analyticsApi.getScore(),
          analyticsApi.getHeatmap(new Date().getFullYear()),
          analyticsApi.getDaily(14),
          analyticsApi.getCategories(),
          analyticsApi.getWeekly(4)
        ]);

        if (scoreRes.data) setScoreData(scoreRes.data);
        if (heatRes.data) setHeatmapData(heatRes.data);
        if (dailyRes.data) setDailyData(dailyRes.data);
        if (catRes.data) setCategoryData(catRes.data);
        if (weekRes.data) setWeeklyData(weekRes.data);
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            <span>Productivity Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deep dive into your working patterns, completion velocity, and domain focus
          </p>
        </div>
      </div>

      {/* Productivity Score */}
      <ProductivityScoreCard scoreData={scoreData} />

      {/* GitHub-style Heatmap */}
      <HeatmapGrid heatmapData={heatmapData} />

      {/* Visual Charts Grid: Daily Completion & Planned vs Actual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyCompletionChart data={dailyData} />
        <PlannedVsActualChart data={dailyData} />
      </div>

      {/* Category Breakdown & Weekly Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBreakdownChart categoryData={categoryData} />

        {/* Weekly Productivity Cards */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Recent Velocity
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Weekly Productivity Breakdown
            </h3>
          </div>

          <div className="space-y-3">
            {weeklyData.map((w, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {w.weekLabel}
                  </span>
                  <span className="text-slate-400">
                    {w.completedTasks} of {w.totalTasks} tasks completed
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {w.totalHours} hrs
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      ~{w.avgHoursPerDay}h/day
                    </span>
                  </div>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40">
                    {w.completionRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
