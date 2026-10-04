import { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  Award,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { analyticsApi } from '../services/api';
import { StatCard } from '../components/dashboard/StatCard';
import { TodayProgressCard } from '../components/dashboard/TodayProgressCard';
import { ActiveTaskHero } from '../components/dashboard/ActiveTaskHero';
import { OverdueBanner } from '../components/dashboard/OverdueBanner';
import { UpcomingList } from '../components/dashboard/UpcomingList';
import { QuickAddTaskBar } from '../components/tasks/QuickAddTaskBar';
import { TaskCard } from '../components/tasks/TaskCard';
import { EmptyState } from '../components/common/EmptyState';
import { getTodayDateStr } from '../utils/dateFormats';

export function DashboardPage() {
  const { tasks, openTaskModal } = useTasks();
  const [overview, setOverview] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = getTodayDateStr();
  const todayTasks = tasks.filter((t) => t.date === today);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overRes, scoreRes] = await Promise.all([
        analyticsApi.getOverview(today),
        analyticsApi.getScore()
      ]);
      if (overRes.data) setOverview(overRes.data);
      if (scoreRes.data) setScoreData(scoreRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [tasks]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Quick Add Bar */}
      <QuickAddTaskBar defaultDate={today} />

      {/* Overdue Items Alert */}
      <OverdueBanner />

      {/* Hero Grid: Today's Progress Card + Active Task Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TodayProgressCard overview={overview} />
        <ActiveTaskHero />
      </div>

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Scheduled"
          value={overview?.total || 0}
          subtitle={`${overview?.pending || 0} pending today`}
          icon={CheckSquare}
          color="indigo"
        />
        <StatCard
          title="Tasks Completed"
          value={overview?.completed || 0}
          subtitle={`${overview?.completionRate || 0}% completion`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Logged Time"
          value={`${overview?.actualHours || 0}h`}
          subtitle={`Planned: ${overview?.plannedHours || 0}h`}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Productivity Score"
          value={scoreData?.score || 70}
          subtitle={scoreData?.trend === 'improving' ? '↑ Improving' : '● Stable'}
          icon={Award}
          color="violet"
          trend={scoreData?.diff ? `${scoreData.diff > 0 ? '+' : ''}${scoreData.diff}%` : null}
        />
      </div>

      {/* Today's Tasks & Upcoming Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Scheduled Work */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Today's Work List</span>
              </h3>
              <p className="text-xs text-slate-400">
                Execute tasks sequentially or start timer directly
              </p>
            </div>

            <button
              type="button"
              onClick={() => openTaskModal(null, { date: today })}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Add Task
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <EmptyState
                icon={Sparkles}
                title="No work scheduled for today"
                description="Keep your momentum going! Add tasks for today or plan upcoming milestones."
                actionLabel="+ Add First Task"
                onAction={() => openTaskModal(null, { date: today })}
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Upcoming 5 Days Work */}
        <div>
          <UpcomingList />
        </div>
      </div>
    </div>
  );
}
