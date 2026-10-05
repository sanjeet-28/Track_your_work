import { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  BarChart2,
  Flame,
  AlertTriangle,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { courseApi } from '../services/api';
import { useTasks } from '../context/TaskContext';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#e11d48'  // Rose
];

export function CoursesPage() {
  const { showToast, fetchTasks } = useTasks();
  const [courses, setCourses] = useState([]);
  const [grandTotalMinutes, setGrandTotalMinutes] = useState(0);
  const [grandTotalFormatted, setGrandTotalFormatted] = useState('0m');
  const [loading, setLoading] = useState(true);

  // Heatmaps cache by courseId
  const [heatmaps, setHeatmaps] = useState({});

  // Add / Edit Modal state
  const [courseModal, setCourseModal] = useState({
    isOpen: false,
    isEdit: false,
    courseId: null,
    code: '',
    name: '',
    color: '#6366f1'
  });
  const [modalSaving, setModalSaving] = useState(false);

  // Delete Confirmation Modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    course: null
  });
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await courseApi.getAll();
      if (res.data) {
        setCourses(res.data.courses || []);
        setGrandTotalMinutes(res.data.grandTotalActualMinutes || 0);
        setGrandTotalFormatted(res.data.grandTotalActualFormatted || '0m');

        // Fetch heatmaps for all courses
        const heatMapObj = {};
        await Promise.all(
          (res.data.courses || []).map(async (c) => {
            try {
              const hRes = await courseApi.getHeatmap(c.id, 60);
              if (hRes.data) {
                heatMapObj[c.id] = hRes.data.heatmap;
              }
            } catch (e) {
              console.error('Heatmap load error for', c.code, e);
            }
          })
        );
        setHeatmaps(heatMapObj);
      }
    } catch (err) {
      console.error('Error loading courses:', err);
      showToast(err.message || 'Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openAddModal = () => {
    setCourseModal({
      isOpen: true,
      isEdit: false,
      courseId: null,
      code: '',
      name: '',
      color: PRESET_COLORS[0]
    });
  };

  const openEditModal = (course) => {
    setCourseModal({
      isOpen: true,
      isEdit: true,
      courseId: course.id,
      code: course.code,
      name: course.name || course.code,
      color: course.color || PRESET_COLORS[0]
    });
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!courseModal.code.trim()) {
      showToast('Course code is required', 'error');
      return;
    }

    setModalSaving(true);
    try {
      if (courseModal.isEdit) {
        await courseApi.update(courseModal.courseId, {
          code: courseModal.code.trim().toUpperCase(),
          name: courseModal.name.trim(),
          color: courseModal.color
        });
        showToast(`Course ${courseModal.code.toUpperCase()} updated`);
      } else {
        await courseApi.create({
          code: courseModal.code.trim().toUpperCase(),
          name: courseModal.name.trim(),
          color: courseModal.color
        });
        showToast(`Course ${courseModal.code.toUpperCase()} registered`);
      }
      setCourseModal({ ...courseModal, isOpen: false });
      fetchCourses();
      fetchTasks();
    } catch (err) {
      showToast(err.message || 'Failed to save course', 'error');
    } finally {
      setModalSaving(false);
    }
  };

  const openDeleteModal = (course) => {
    setDeleteModal({
      isOpen: true,
      course
    });
  };

  const handleDeleteCourse = async (deleteTasks) => {
    if (!deleteModal.course) return;
    setDeleting(true);
    try {
      await courseApi.delete(deleteModal.course.id, deleteTasks);
      showToast(
        deleteTasks
          ? `Deleted ${deleteModal.course.code} and its tasks`
          : `Deleted course ${deleteModal.course.code} (tasks preserved)`
      );
      setDeleteModal({ isOpen: false, course: null });
      fetchCourses();
      fetchTasks();
    } catch (err) {
      showToast(err.message || 'Failed to delete course', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-500" />
            <span>Course Management & Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-detected courses, work-session study time, completion rates, and productivity heatmaps
          </p>
        </div>

        <Button onClick={openAddModal} variant="primary" size="sm" icon={Plus}>
          Add Course
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Total Courses</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
            {courses.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Registered in tracker</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Total Study Time</span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
            {grandTotalFormatted}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">From real work sessions</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Total Tasks</span>
          <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-1 block">
            {courses.reduce((sum, c) => sum + c.stats.totalTasks, 0)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {courses.reduce((sum, c) => sum + c.stats.completedTasks, 0)} completed
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Total Work Sessions</span>
          <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-1 block">
            {courses.reduce((sum, c) => sum + c.stats.workSessionsCount, 0)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Timer sessions logged</span>
        </div>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span>Loading course analytics and heatmaps...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto opacity-70" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            No courses detected yet
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Courses are automatically created when you add tasks starting with a course code like{' '}
            <span className="font-mono font-bold text-indigo-500">COL333 lec 4</span> or{' '}
            <span className="font-mono font-bold text-indigo-500">ELL205 tut 1</span>, or you can register one manually!
          </p>
          <Button onClick={openAddModal} variant="primary" size="sm" icon={Plus}>
            Add First Course
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course) => {
            const courseHeat = heatmaps[course.id] || [];

            return (
              <div
                key={course.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                {/* Course Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="px-3 py-1 rounded-xl text-sm font-extrabold font-mono tracking-tight shadow-xs"
                      style={{
                        backgroundColor: `${course.color}20`,
                        color: course.color,
                        border: `1.5px solid ${course.color}50`
                      }}
                    >
                      {course.code}
                    </span>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {course.name || course.code}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {course.stats.percentOfTotalStudyTime}% of total study time
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(course)}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Course"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteModal(course)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Key Course Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Actual Work</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                      {course.stats.totalActualFormatted}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Planned Time</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                      {course.stats.totalPlannedFormatted}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Tasks Done</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                      {course.stats.completedTasks} / {course.stats.totalTasks}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Sessions</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-xs">
                      {course.stats.workSessionsCount}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>Completion Rate</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      {course.stats.completionRate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${course.stats.completionRate}%`,
                        backgroundColor: course.color
                      }}
                    />
                  </div>
                </div>

                {/* Course Heatmap Mini Stream */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <span>Productivity Heatmap (60 Days)</span>
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                      <span>Less</span>
                      <span className="w-2.5 h-2.5 rounded-xs bg-slate-200 dark:bg-slate-800"></span>
                      <span className="w-2.5 h-2.5 rounded-xs bg-indigo-300 dark:bg-indigo-700"></span>
                      <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 dark:bg-indigo-500"></span>
                      <span className="w-2.5 h-2.5 rounded-xs bg-indigo-700 dark:bg-indigo-400"></span>
                      <span>More</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                    {courseHeat.length > 0 ? (
                      courseHeat.map((cell) => {
                        let bg = 'bg-slate-200/70 dark:bg-slate-800';
                        if (cell.level === 1) bg = 'bg-indigo-200 dark:bg-indigo-900/60';
                        else if (cell.level === 2) bg = 'bg-indigo-400 dark:bg-indigo-600';
                        else if (cell.level === 3) bg = 'bg-indigo-600 dark:bg-indigo-500';
                        else if (cell.level === 4) bg = 'bg-indigo-800 dark:bg-indigo-400';

                        return (
                          <div
                            key={cell.date}
                            className={`w-3 h-3 rounded-xs ${bg} transition-transform hover:scale-125 cursor-pointer`}
                            title={`${cell.date}: ${cell.hours}h tracked (${cell.minutes}m)`}
                          />
                        );
                      })
                    ) : (
                      <span className="text-[11px] text-slate-400 italic py-1">
                        Heatmap will populate as work sessions are logged.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Course Modal */}
      <Modal
        isOpen={courseModal.isOpen}
        onClose={() => setCourseModal({ ...courseModal, isOpen: false })}
        title={courseModal.isEdit ? `Edit Course ${courseModal.code}` : 'Add Course'}
        subtitle="Manage course code, title, and visual identification color"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveCourse} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Course Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. COL333, ELL205, AIL2872"
              value={courseModal.code}
              onChange={(e) => setCourseModal({ ...courseModal, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Course Name / Title
            </label>
            <input
              type="text"
              placeholder="e.g. Operating Systems, Signals & Systems"
              value={courseModal.name}
              onChange={(e) => setCourseModal({ ...courseModal, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Color Theme
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((clr) => (
                <button
                  key={clr}
                  type="button"
                  onClick={() => setCourseModal({ ...courseModal, color: clr })}
                  className={`w-7 h-7 rounded-xl transition-all cursor-pointer ${
                    courseModal.color === clr ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: clr }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCourseModal({ ...courseModal, isOpen: false })}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={modalSaving}
            >
              {courseModal.isEdit ? 'Save Changes' : 'Create Course'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Course Confirmation Modal (Requirement 8) */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, course: null })}
        title={`Delete ${deleteModal.course?.code}?`}
        subtitle={`This course has ${deleteModal.course?.stats?.totalTasks || 0} tasks and ${deleteModal.course?.stats?.totalActualFormatted || '0m'} of tracked work.`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Please choose how you want to handle existing tasks for this course. By default, your tasks will <strong>NOT</strong> be deleted.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              disabled={deleting}
              onClick={() => handleDeleteCourse(false)}
              className="w-full p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-left hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all cursor-pointer group"
            >
              <div className="font-bold text-indigo-700 dark:text-indigo-300 text-xs">
                Delete Course Only
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Remove the course code. All {deleteModal.course?.stats?.totalTasks || 0} tasks and past work sessions are safely kept in your tracker.
              </div>
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={() => handleDeleteCourse(true)}
              className="w-full p-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30 text-left hover:bg-red-100 dark:hover:bg-red-900/50 transition-all cursor-pointer group"
            >
              <div className="font-bold text-red-600 dark:text-red-400 text-xs">
                Delete Course + Heatmap/Data
              </div>
              <div className="text-[11px] text-red-500/80 dark:text-red-400/80 mt-0.5">
                Permanently delete this course along with all associated tasks, sessions, and heatmap history.
              </div>
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deleting}
              onClick={() => setDeleteModal({ isOpen: false, course: null })}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
