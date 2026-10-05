import { useState, useEffect } from 'react';
import { Flame, Clock, Award, BookOpen, AlertCircle } from 'lucide-react';
import { courseApi } from '../../services/api';

export function CourseHeatmapSection() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heatLoading, setHeatLoading] = useState(false);

  const fetchOverviewAndCourses = async () => {
    try {
      setLoading(true);
      const [coursesRes, overviewRes] = await Promise.all([
        courseApi.getAll(),
        courseApi.getOverview()
      ]);

      if (coursesRes.data && coursesRes.data.courses) {
        setCourses(coursesRes.data.courses);
        if (coursesRes.data.courses.length > 0 && !selectedCourseId) {
          setSelectedCourseId(coursesRes.data.courses[0].id);
        }
      }

      if (overviewRes.data) {
        setOverview(overviewRes.data);
      }
    } catch (err) {
      console.error('Error fetching course heatmaps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewAndCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;

    const fetchCourseHeatmap = async () => {
      try {
        setHeatLoading(true);
        const res = await courseApi.getHeatmap(selectedCourseId, 90);
        if (res.data) {
          setHeatmapData(res.data);
        }
      } catch (err) {
        console.error('Error loading course heatmap:', err);
      } finally {
        setHeatLoading(false);
      }
    };

    fetchCourseHeatmap();
  }, [selectedCourseId]);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-center py-12 text-xs text-slate-400">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2"></div>
        <span>Loading course productivity tracking...</span>
      </div>
    );
  }

  if (courses.length === 0) {
    return null; // Empty courses handled gracefully
  }

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 block">
            Focus & Intensity
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Course Productivity Heatmaps</span>
          </h3>
        </div>

        {/* Course Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {courses.map((course) => {
            const isSelected = course.id === selectedCourseId;
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => setSelectedCourseId(course.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {course.code}
              </button>
            );
          })}
        </div>
      </div>

      {/* Most Studied vs Neglected Callouts */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Most Studied */}
          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Top Priority Course
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {overview.mostStudied?.[0]?.code || 'None yet'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                {overview.mostStudied?.[0]?.stats?.totalActualFormatted || '0m'} tracked ({overview.mostStudied?.[0]?.stats?.percentOfTotalStudyTime || 0}% of study time)
              </span>
            </div>
          </div>

          {/* Neglected Course */}
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                Needs Attention / Neglected
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {overview.neglected?.[0]?.code || 'None'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                {overview.neglected?.[0]?.stats?.totalActualFormatted || '0m'} tracked ({overview.neglected?.[0]?.stats?.completedTasks || 0}/{overview.neglected?.[0]?.stats?.totalTasks || 0} tasks done)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Course Stats and Heatmap */}
      {activeCourse && (
        <div className="space-y-4 pt-2">
          {/* Active Course Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block">Actual Time Spent</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {activeCourse.stats.totalActualFormatted}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block">Planned Time</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {activeCourse.stats.totalPlannedFormatted}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block">Completion Rate</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                {activeCourse.stats.completionRate}% ({activeCourse.stats.completedTasks}/{activeCourse.stats.totalTasks})
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block">Work Sessions</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {activeCourse.stats.workSessionsCount} sessions
              </span>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {activeCourse.code} Activity (Last 90 Days)
              </span>

              {/* Legend: Less ░ ▒ ▓ █ More */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                <span>Less</span>
                <span className="w-3 h-3 rounded-xs bg-slate-200 dark:bg-slate-800"></span>
                <span className="w-3 h-3 rounded-xs bg-indigo-200 dark:bg-indigo-900/60"></span>
                <span className="w-3 h-3 rounded-xs bg-indigo-400 dark:bg-indigo-600/70"></span>
                <span className="w-3 h-3 rounded-xs bg-indigo-600 dark:bg-indigo-500"></span>
                <span className="w-3 h-3 rounded-xs bg-indigo-800 dark:bg-indigo-400"></span>
                <span>More</span>
              </div>
            </div>

            {heatLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Rendering heatmap...
              </div>
            ) : heatmapData && heatmapData.heatmap ? (
              <div className="flex flex-wrap gap-1 pt-1">
                {heatmapData.heatmap.map((cell) => {
                  let bg = 'bg-slate-200/80 dark:bg-slate-800';
                  if (cell.level === 1) bg = 'bg-indigo-200 dark:bg-indigo-900/60';
                  else if (cell.level === 2) bg = 'bg-indigo-400 dark:bg-indigo-600/70';
                  else if (cell.level === 3) bg = 'bg-indigo-600 dark:bg-indigo-500';
                  else if (cell.level === 4) bg = 'bg-indigo-800 dark:bg-indigo-400';

                  return (
                    <div
                      key={cell.date}
                      className={`w-3.5 h-3.5 rounded-xs ${bg} transition-transform hover:scale-125 cursor-pointer`}
                      title={`${cell.date}: ${cell.hours}h tracked (${cell.minutes}m)`}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                No activity recorded yet for {activeCourse.code}.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
