const prisma = require('../lib/prisma');
const {
  getTodayDateStr,
  addDays,
  getWeekBoundaries,
  getMonthBoundaries
} = require('../utils/dateUtils');
const { getActiveSession } = require('./timerService');

async function getOverview(dateStr = getTodayDateStr()) {
  const tasks = await prisma.task.findMany({
    where: { date: dateStr }
  });

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const pending = tasks.filter(t => t.status === 'TODO').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const plannedMinutes = tasks.reduce((sum, t) => sum + (t.estimatedDuration || 0), 0);
  const actualMinutes = tasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0);

  // Overdue count
  const overdueCount = await prisma.task.count({
    where: {
      date: { lt: dateStr },
      status: { in: ['TODO', 'IN_PROGRESS'] }
    }
  });

  // Active session
  const activeSession = await getActiveSession();

  return {
    date: dateStr,
    total,
    completed,
    inProgress,
    pending,
    completionRate,
    plannedMinutes,
    plannedHours: Number((plannedMinutes / 60).toFixed(1)),
    actualMinutes,
    actualHours: Number((actualMinutes / 60).toFixed(1)),
    timeDifferenceMinutes: actualMinutes - plannedMinutes,
    overdueCount,
    activeTask: activeSession ? activeSession.task : null,
    activeSession: activeSession || null
  };
}

async function getDailyCompletion(days = 14) {
  const today = getTodayDateStr();
  const startDate = addDays(today, -days + 1);

  const tasks = await prisma.task.findMany({
    where: {
      date: {
        gte: startDate,
        lte: today
      }
    }
  });

  const dayMap = {};
  for (let i = 0; i < days; i++) {
    const dStr = addDays(startDate, i);
    const dateObj = new Date(dStr + 'T00:00:00');
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    dayMap[dStr] = {
      date: dStr,
      displayDate: formattedDate,
      dayName,
      total: 0,
      completed: 0,
      plannedMinutes: 0,
      actualMinutes: 0,
      plannedHours: 0,
      actualHours: 0,
      completionRate: 0
    };
  }

  tasks.forEach(t => {
    if (dayMap[t.date]) {
      dayMap[t.date].total += 1;
      if (t.status === 'COMPLETED') {
        dayMap[t.date].completed += 1;
      }
      dayMap[t.date].plannedMinutes += t.estimatedDuration || 0;
      dayMap[t.date].actualMinutes += t.actualDuration || 0;
    }
  });

  const result = Object.values(dayMap).map(day => {
    const plannedHours = Number((day.plannedMinutes / 60).toFixed(1));
    const actualHours = Number((day.actualMinutes / 60).toFixed(1));
    const completionRate = day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0;
    return {
      ...day,
      plannedHours,
      actualHours,
      completionRate
    };
  });

  return result;
}

async function getWeeklyProductivity(weeksCount = 8) {
  const today = getTodayDateStr();
  const result = [];

  for (let w = weeksCount - 1; w >= 0; w--) {
    const offsetDate = addDays(today, -w * 7);
    const { startDate, endDate } = getWeekBoundaries(offsetDate);

    const tasks = await prisma.task.findMany({
      where: {
        date: { gte: startDate, lte: endDate }
      }
    });

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const actualMinutes = tasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0);
    const totalHours = Number((actualMinutes / 60).toFixed(1));
    const avgHoursPerDay = Number((totalHours / 7).toFixed(1));

    const sDate = new Date(startDate + 'T00:00:00');
    const eDate = new Date(endDate + 'T00:00:00');
    const label = `${sDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${eDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    result.push({
      weekLabel: label,
      startDate,
      endDate,
      totalTasks: total,
      completedTasks: completed,
      completionRate,
      totalHours,
      avgHoursPerDay
    });
  }

  return result;
}

async function getMonthlyProductivity(monthsCount = 6) {
  const now = new Date();
  const result = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const { startDate, endDate } = getMonthBoundaries(year, month);

    const tasks = await prisma.task.findMany({
      where: {
        date: { gte: startDate, lte: endDate }
      }
    });

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const actualMinutes = tasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0);
    const totalHours = Number((actualMinutes / 60).toFixed(1));
    const daysInMonth = new Date(year, month, 0).getDate();
    const avgHoursPerDay = Number((totalHours / daysInMonth).toFixed(1));

    result.push({
      monthLabel: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      year,
      month,
      totalTasks: total,
      completedTasks: completed,
      completionRate,
      totalHours,
      avgHoursPerDay
    });
  }

  return result;
}

async function getCategoryAnalytics(startDate, endDate) {
  const where = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const tasks = await prisma.task.findMany({
    where,
    include: { category: true }
  });

  const catMap = {};
  let overallMinutes = 0;

  tasks.forEach(t => {
    const catName = t.category ? t.category.name : 'Uncategorized';
    const catColor = t.category ? t.category.color : '#94a3b8';
    const duration = t.actualDuration > 0 ? t.actualDuration : t.estimatedDuration || 0;
    overallMinutes += duration;

    if (!catMap[catName]) {
      catMap[catName] = {
        name: catName,
        color: catColor,
        totalTasks: 0,
        completedTasks: 0,
        totalMinutes: 0
      };
    }

    catMap[catName].totalTasks += 1;
    if (t.status === 'COMPLETED') {
      catMap[catName].completedTasks += 1;
    }
    catMap[catName].totalMinutes += duration;
  });

  const categories = Object.values(catMap).map(c => ({
    ...c,
    hours: Number((c.totalMinutes / 60).toFixed(1)),
    percentage: overallMinutes > 0 ? Math.round((c.totalMinutes / overallMinutes) * 100) : 0
  })).sort((a, b) => b.totalMinutes - a.totalMinutes);

  return {
    totalMinutes: overallMinutes,
    totalHours: Number((overallMinutes / 60).toFixed(1)),
    categories
  };
}

async function getHeatmapData(year) {
  const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
  const startDate = `${targetYear}-01-01`;
  const endDate = `${targetYear}-12-31`;

  const tasks = await prisma.task.findMany({
    where: {
      date: { gte: startDate, lte: endDate }
    },
    include: {
      workSessions: true
    }
  });

  const dayMap = {};

  tasks.forEach(t => {
    if (!dayMap[t.date]) {
      dayMap[t.date] = {
        date: t.date,
        completedTasks: 0,
        totalTasks: 0,
        workingMinutes: 0,
        sessionCount: 0
      };
    }

    dayMap[t.date].totalTasks += 1;
    if (t.status === 'COMPLETED') {
      dayMap[t.date].completedTasks += 1;
    }
    dayMap[t.date].workingMinutes += t.actualDuration || 0;
    dayMap[t.date].sessionCount += t.workSessions ? t.workSessions.length : 0;
  });

  const daysList = Object.values(dayMap).map(d => {
    const hours = Number((d.workingMinutes / 60).toFixed(1));
    // Determine GitHub-style intensity (0 to 4)
    let intensity = 0;
    if (hours > 5 || d.completedTasks >= 5) intensity = 4;
    else if (hours >= 3 || d.completedTasks >= 3) intensity = 3;
    else if (hours >= 1.5 || d.completedTasks >= 2) intensity = 2;
    else if (hours > 0 || d.completedTasks >= 1) intensity = 1;

    return {
      date: d.date,
      completedTasks: d.completedTasks,
      totalTasks: d.totalTasks,
      hours,
      sessions: d.sessionCount,
      intensity
    };
  });

  return {
    year: targetYear,
    days: daysList
  };
}

async function getProductivityScore() {
  const today = getTodayDateStr();
  
  // Current 7 days
  const currentStart = addDays(today, -6);
  const currentTasks = await prisma.task.findMany({
    where: { date: { gte: currentStart, lte: today } }
  });

  // Previous 7 days (for trend comparison)
  const prevStart = addDays(today, -13);
  const prevEnd = addDays(today, -7);
  const prevTasks = await prisma.task.findMany({
    where: { date: { gte: prevStart, lte: prevEnd } }
  });

  function calculateScoreForSet(tasks) {
    if (tasks.length === 0) {
      return {
        score: 70, // Baseline neutral score
        completionRate: 0,
        timeAccuracy: 0,
        priorityAdherence: 0,
        streakDays: 0,
        overduePenalty: 0
      };
    }

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const completionRate = (completed / total) * 100;

    // Time accuracy
    const planned = tasks.reduce((sum, t) => sum + (t.estimatedDuration || 0), 0);
    const actual = tasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0);
    let timeAccuracy = 100;
    if (planned > 0 && actual > 0) {
      timeAccuracy = Math.min(100, Math.round((Math.min(planned, actual) / Math.max(planned, actual)) * 100));
    } else if (planned === 0 && actual === 0) {
      timeAccuracy = 80;
    }

    // Priority adherence (High / Urgent completed)
    const highUrgent = tasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT');
    const highUrgentCompleted = highUrgent.filter(t => t.status === 'COMPLETED').length;
    const priorityAdherence = highUrgent.length > 0 ? (highUrgentCompleted / highUrgent.length) * 100 : 80;

    // Consistency: how many distinct days had at least 1 completed task
    const activeDays = new Set(tasks.filter(t => t.status === 'COMPLETED').map(t => t.date)).size;
    const consistencyRate = Math.min(100, (activeDays / 7) * 100);

    // Overdue penalty
    const overdueCount = tasks.filter(t => t.date < today && t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length;
    const overduePenalty = Math.min(15, overdueCount * 3);

    // Formula weights:
    // Completion rate: 35%
    // Time accuracy: 25%
    // Priority adherence: 15%
    // Consistency: 15%
    // Penalty: overdue up to 15%
    const rawScore =
      completionRate * 0.35 +
      timeAccuracy * 0.25 +
      priorityAdherence * 0.15 +
      consistencyRate * 0.15 -
      overduePenalty;

    const score = Math.min(100, Math.max(0, Math.round(rawScore)));

    return {
      score,
      completionRate: Math.round(completionRate),
      timeAccuracy: Math.round(timeAccuracy),
      priorityAdherence: Math.round(priorityAdherence),
      consistencyRate: Math.round(consistencyRate),
      streakDays: activeDays,
      overduePenalty
    };
  }

  const current = calculateScoreForSet(currentTasks);
  const prev = calculateScoreForSet(prevTasks);

  const diff = current.score - prev.score;
  const trend = diff > 0 ? 'improving' : (diff < 0 ? 'declining' : 'stable');

  return {
    score: current.score,
    previousScore: prev.score,
    diff,
    trend,
    breakdown: {
      completionRate: current.completionRate,
      completionDiff: current.completionRate - prev.completionRate,
      timeAccuracy: current.timeAccuracy,
      priorityAdherence: current.priorityAdherence,
      consistencyRate: current.consistencyRate,
      consistencyDiff: current.consistencyRate - prev.consistencyRate,
      overduePenalty: current.overduePenalty
    }
  };
}

module.exports = {
  getOverview,
  getDailyCompletion,
  getWeeklyProductivity,
  getMonthlyProductivity,
  getCategoryAnalytics,
  getHeatmapData,
  getProductivityScore
};
