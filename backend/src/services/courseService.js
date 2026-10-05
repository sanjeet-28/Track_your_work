const prisma = require('../lib/prisma');
const { getTodayDateStr } = require('../utils/dateUtils');
const { getCourseColor } = require('../utils/detectionUtils');

/**
 * Format minutes into human-readable hours and minutes (e.g., "2h 30m" or "45m")
 */
function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Get all courses with high-level stats and study time distribution
 */
async function getAllCourses() {
  const courses = await prisma.course.findMany({
    orderBy: { code: 'asc' },
    include: {
      tasks: {
        include: {
          workSessions: true
        }
      }
    }
  });

  // Calculate grand total actual study time across all courses
  let grandTotalActualMinutes = 0;
  courses.forEach(course => {
    course.tasks.forEach(task => {
      task.workSessions.forEach(ws => {
        grandTotalActualMinutes += (ws.duration || 0);
      });
    });
  });

  const formattedCourses = courses.map(course => {
    let totalActualMinutes = 0;
    let totalPlannedMinutes = 0;
    let completedTasks = 0;
    let workSessionsCount = 0;
    let lastSessionTime = null;

    course.tasks.forEach(task => {
      if (task.status === 'COMPLETED') completedTasks++;
      totalPlannedMinutes += (task.estimatedDuration || 0);

      task.workSessions.forEach(ws => {
        const dur = ws.duration || 0;
        totalActualMinutes += dur;
        workSessionsCount++;
        const sTime = new Date(ws.startTime).getTime();
        if (!lastSessionTime || sTime > lastSessionTime) {
          lastSessionTime = sTime;
        }
      });
    });

    const totalTasks = course.tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const percentOfTotalStudyTime = grandTotalActualMinutes > 0
      ? Math.round((totalActualMinutes / grandTotalActualMinutes) * 100)
      : 0;

    return {
      id: course.id,
      code: course.code,
      name: course.name || course.code,
      color: course.color,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      stats: {
        totalTasks,
        completedTasks,
        completionRate,
        totalPlannedMinutes,
        totalPlannedFormatted: formatDuration(totalPlannedMinutes),
        totalActualMinutes,
        totalActualFormatted: formatDuration(totalActualMinutes),
        totalActualHours: +(totalActualMinutes / 60).toFixed(1),
        workSessionsCount,
        percentOfTotalStudyTime,
        lastStudiedAt: lastSessionTime ? new Date(lastSessionTime).toISOString() : null
      }
    };
  });

  return {
    courses: formattedCourses,
    grandTotalActualMinutes,
    grandTotalActualFormatted: formatDuration(grandTotalActualMinutes)
  };
}

/**
 * Get single course with full statistics, task breakdown, and recent activity
 */
async function getCourseById(id) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: { date: 'desc' },
        include: {
          category: true,
          workSessions: {
            orderBy: { startTime: 'desc' }
          }
        }
      }
    }
  });

  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  // Calculate all study time for percent calculation
  const allSessions = await prisma.workSession.findMany({ select: { duration: true } });
  const grandTotalMinutes = allSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  let totalActualMinutes = 0;
  let totalPlannedMinutes = 0;
  let completedTasks = 0;
  let workSessionsCount = 0;
  const taskTypeBreakdown = {};

  course.tasks.forEach(task => {
    if (task.status === 'COMPLETED') completedTasks++;
    totalPlannedMinutes += (task.estimatedDuration || 0);

    const typeKey = task.taskType || 'Other';
    taskTypeBreakdown[typeKey] = (taskTypeBreakdown[typeKey] || 0) + 1;

    task.workSessions.forEach(ws => {
      totalActualMinutes += (ws.duration || 0);
      workSessionsCount++;
    });
  });

  const totalTasks = course.tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const percentOfTotal = grandTotalMinutes > 0 ? Math.round((totalActualMinutes / grandTotalMinutes) * 100) : 0;

  return {
    id: course.id,
    code: course.code,
    name: course.name || course.code,
    color: course.color,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    stats: {
      totalTasks,
      completedTasks,
      completionRate,
      totalPlannedMinutes,
      totalPlannedFormatted: formatDuration(totalPlannedMinutes),
      totalActualMinutes,
      totalActualFormatted: formatDuration(totalActualMinutes),
      totalActualHours: +(totalActualMinutes / 60).toFixed(1),
      workSessionsCount,
      percentOfTotalStudyTime: percentOfTotal,
      taskTypeBreakdown
    },
    tasks: course.tasks.map(t => ({
      id: t.id,
      title: t.title,
      date: t.date,
      status: t.status,
      priority: t.priority,
      taskType: t.taskType,
      estimatedDuration: t.estimatedDuration,
      actualDuration: t.actualDuration,
      category: t.category,
      workSessionsCount: t.workSessions.length
    }))
  };
}

/**
 * Create a new course
 */
async function createCourse(data) {
  const { code, name, color } = data;
  if (!code || !code.trim()) {
    const error = new Error('Course code is required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedCode = code.trim().replace(/[-_]/g, '').toUpperCase();

  const existing = await prisma.course.findUnique({
    where: { code: normalizedCode }
  });

  if (existing) {
    const error = new Error(`Course with code ${normalizedCode} already exists`);
    error.statusCode = 400;
    throw error;
  }

  const course = await prisma.course.create({
    data: {
      code: normalizedCode,
      name: name && name.trim() ? name.trim() : normalizedCode,
      color: color && color.trim() ? color.trim() : getCourseColor(normalizedCode)
    }
  });

  return course;
}

/**
 * Update course details
 */
async function updateCourse(id, data) {
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  const { code, name, color } = data;
  const updateData = {};

  if (code !== undefined && code.trim()) {
    const normalizedCode = code.trim().replace(/[-_]/g, '').toUpperCase();
    if (normalizedCode !== existing.code) {
      const codeCheck = await prisma.course.findUnique({ where: { code: normalizedCode } });
      if (codeCheck) {
        const error = new Error(`Course with code ${normalizedCode} already exists`);
        error.statusCode = 400;
        throw error;
      }
      updateData.code = normalizedCode;
    }
  }

  if (name !== undefined) {
    updateData.name = name.trim() || updateData.code || existing.code;
  }

  if (color !== undefined && color.trim()) {
    updateData.color = color.trim();
  }

  const updated = await prisma.course.update({
    where: { id },
    data: updateData
  });

  return updated;
}

/**
 * Delete a course with option to preserve or cascade tasks.
 * deleteTasks: boolean - if false, retains tasks and disassociates courseId (sets courseId to null).
 */
async function deleteCourse(id, deleteTasks = false) {
  const existing = await prisma.course.findUnique({
    where: { id },
    include: {
      tasks: {
        include: { workSessions: true }
      }
    }
  });

  if (!existing) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  let tasksCount = existing.tasks.length;
  let totalWorkMinutes = 0;
  existing.tasks.forEach(t => {
    t.workSessions.forEach(ws => {
      totalWorkMinutes += (ws.duration || 0);
    });
  });

  if (deleteTasks) {
    // Delete all tasks for this course (workSessions cascade deleted automatically)
    await prisma.task.deleteMany({
      where: { courseId: id }
    });
  } else {
    // Nullify courseId on tasks so tasks are preserved!
    await prisma.task.updateMany({
      where: { courseId: id },
      data: { courseId: null }
    });
  }

  // Delete course
  await prisma.course.delete({ where: { id } });

  return {
    success: true,
    deletedId: id,
    code: existing.code,
    tasksDeleted: Boolean(deleteTasks),
    tasksCount,
    totalWorkMinutes,
    totalWorkFormatted: formatDuration(totalWorkMinutes)
  };
}

/**
 * Course Productivity Heatmap:
 * Returns daily study activity for this course over a specified number of days (e.g., 90 or 365).
 * Uses actual work session minutes.
 */
async function getCourseHeatmap(courseId, days = 90) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, code: true, name: true, color: true }
  });

  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  // Find all work sessions for tasks of this course
  const workSessions = await prisma.workSession.findMany({
    where: {
      task: {
        courseId: courseId
      }
    },
    select: {
      startTime: true,
      duration: true
    }
  });

  // Also find completed tasks for this course to ensure completed task dates are captured
  const tasks = await prisma.task.findMany({
    where: { courseId: courseId },
    select: { date: true, actualDuration: true, status: true }
  });

  // Aggregate minutes by local date string YYYY-MM-DD
  const dateMinutesMap = {};

  workSessions.forEach(ws => {
    // Extract local YYYY-MM-DD from startTime
    const d = new Date(ws.startTime);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dateMinutesMap[dateStr] = (dateMinutesMap[dateStr] || 0) + (ws.duration || 0);
  });

  // If a task had actualDuration but no standalone work sessions (or legacy task), add it
  tasks.forEach(t => {
    if (t.date && t.actualDuration > 0 && !dateMinutesMap[t.date]) {
      dateMinutesMap[t.date] = (dateMinutesMap[t.date] || 0) + t.actualDuration;
    }
  });

  // Generate range of dates
  const today = new Date();
  const heatmapData = [];

  for (let i = days - 1; i >= 0; i--) {
    const target = new Date();
    target.setDate(today.getDate() - i);
    const dateStr = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;

    const minutes = dateMinutesMap[dateStr] || 0;
    const hours = +(minutes / 60).toFixed(1);

    // Intensity level: 0 (no work), 1 (1-30m), 2 (30-90m), 3 (90-180m), 4 (>180m)
    let level = 0;
    if (minutes > 180) level = 4;
    else if (minutes >= 90) level = 3;
    else if (minutes >= 30) level = 2;
    else if (minutes > 0) level = 1;

    heatmapData.push({
      date: dateStr,
      minutes,
      hours,
      level
    });
  }

  return {
    course,
    totalTrackedMinutes: Object.values(dateMinutesMap).reduce((a, b) => a + b, 0),
    totalTrackedFormatted: formatDuration(Object.values(dateMinutesMap).reduce((a, b) => a + b, 0)),
    heatmap: heatmapData
  };
}

/**
 * Daily Course Bar Graph:
 * How much actual time was spent on each course on a specific day (default today).
 */
async function getDailyCourseBreakdown(dateStr = getTodayDateStr()) {
  // Query work sessions on this date (start of day to end of day in local time)
  // WorkSession.startTime is stored as ISO UTC
  const [year, month, day] = dateStr.split('-').map(Number);
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

  const workSessions = await prisma.workSession.findMany({
    where: {
      startTime: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: {
      task: {
        include: {
          course: true
        }
      }
    }
  });

  // Also check tasks scheduled for this date that have recorded actualDuration
  const tasksOnDate = await prisma.task.findMany({
    where: {
      date: dateStr,
      courseId: { not: null }
    },
    include: {
      course: true,
      workSessions: true
    }
  });

  const courseTimeMap = {};

  // First aggregate from actual work sessions
  workSessions.forEach(ws => {
    const course = ws.task?.course;
    const courseId = course ? course.id : 'unknown';
    const code = course ? course.code : 'Other';
    const name = course ? (course.name || course.code) : 'Other';
    const color = course ? course.color : '#94a3b8';

    if (!courseTimeMap[courseId]) {
      courseTimeMap[courseId] = {
        courseId: course ? course.id : null,
        code,
        name,
        color,
        minutes: 0,
        sessionsCount: 0
      };
    }

    courseTimeMap[courseId].minutes += (ws.duration || 0);
    courseTimeMap[courseId].sessionsCount += 1;
  });

  // If there are tasks on that date with actualDuration but no workSessions recorded on that date
  tasksOnDate.forEach(task => {
    if (task.course && task.actualDuration > 0 && task.workSessions.length === 0) {
      const courseId = task.course.id;
      if (!courseTimeMap[courseId]) {
        courseTimeMap[courseId] = {
          courseId: task.course.id,
          code: task.course.code,
          name: task.course.name || task.course.code,
          color: task.course.color,
          minutes: 0,
          sessionsCount: 0
        };
      }
      courseTimeMap[courseId].minutes += task.actualDuration;
    }
  });

  const coursesList = Object.values(courseTimeMap)
    .filter(c => c.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .map(c => ({
      ...c,
      hours: +(c.minutes / 60).toFixed(1),
      formatted: formatDuration(c.minutes)
    }));

  const totalMinutes = coursesList.reduce((sum, c) => sum + c.minutes, 0);

  return {
    date: dateStr,
    totalMinutes,
    totalFormatted: formatDuration(totalMinutes),
    totalHours: +(totalMinutes / 60).toFixed(1),
    courses: coursesList
  };
}

/**
 * Course Analytics Overview:
 * Returns most studied courses, neglected courses, and study breakdown.
 */
async function getCourseAnalyticsOverview() {
  const allCoursesData = await getAllCourses();
  const { courses, grandTotalActualMinutes, grandTotalActualFormatted } = allCoursesData;

  // Sort by actual time spent
  const sorted = [...courses].sort((a, b) => b.stats.totalActualMinutes - a.stats.totalActualMinutes);

  const mostStudied = sorted.filter(c => c.stats.totalActualMinutes > 0).slice(0, 3);
  
  // Neglected: courses with 0 study time or low completion rate or no recent study
  const neglected = [...courses].sort((a, b) => a.stats.totalActualMinutes - b.stats.totalActualMinutes).slice(0, 3);

  return {
    coursesCount: courses.length,
    grandTotalActualMinutes,
    grandTotalActualFormatted,
    mostStudied,
    neglected,
    allCourses: sorted
  };
}

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseHeatmap,
  getDailyCourseBreakdown,
  getCourseAnalyticsOverview
};
