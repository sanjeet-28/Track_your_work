const prisma = require('../lib/prisma');
const { getTodayDateStr, addDays, getWeekBoundaries } = require('../utils/dateUtils');

async function getDailyReview(req, res, next) {
  try {
    const date = req.params.date || getTodayDateStr();
    
    // Find review if already written
    const review = await prisma.dailyReview.findUnique({
      where: { date }
    });

    // Also get day's actual task stats
    const tasks = await prisma.task.findMany({
      where: { date }
    });

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const plannedMinutes = tasks.reduce((sum, t) => sum + (t.estimatedDuration || 0), 0);
    const actualMinutes = tasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0);

    const stats = {
      total,
      completed,
      plannedHours: Number((plannedMinutes / 60).toFixed(1)),
      actualHours: Number((actualMinutes / 60).toFixed(1)),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };

    res.json({
      success: true,
      data: {
        date,
        review,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
}

async function saveDailyReview(req, res, next) {
  try {
    const {
      date = getTodayDateStr(),
      rating = 3,
      whatWentWell,
      whatToImprove,
      tomorrowPriority
    } = req.body;

    // Calculate actual task numbers for this date
    const tasks = await prisma.task.findMany({ where: { date } });
    const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
    const plannedMinutes = tasks.reduce((sum, t) => sum + (t.estimatedDuration || 0), 0);
    const actualMinutes = tasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0);

    const review = await prisma.dailyReview.upsert({
      where: { date },
      update: {
        rating: Math.min(5, Math.max(1, parseInt(rating, 10) || 3)),
        completedCount,
        plannedHours: Number((plannedMinutes / 60).toFixed(1)),
        actualHours: Number((actualMinutes / 60).toFixed(1)),
        whatWentWell: whatWentWell || null,
        whatToImprove: whatToImprove || null,
        tomorrowPriority: tomorrowPriority || null
      },
      create: {
        date,
        rating: Math.min(5, Math.max(1, parseInt(rating, 10) || 3)),
        completedCount,
        plannedHours: Number((plannedMinutes / 60).toFixed(1)),
        actualHours: Number((actualMinutes / 60).toFixed(1)),
        whatWentWell: whatWentWell || null,
        whatToImprove: whatToImprove || null,
        tomorrowPriority: tomorrowPriority || null
      }
    });

    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

async function getWeeklyReview(req, res, next) {
  try {
    const { startDate: paramStart } = req.params;
    const baseDate = paramStart || getTodayDateStr();
    const { startDate, endDate } = getWeekBoundaries(baseDate);

    // Current week tasks
    const tasks = await prisma.task.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { category: true }
    });

    // Previous week tasks for comparison
    const prevStartDate = addDays(startDate, -7);
    const prevEndDate = addDays(endDate, -7);
    const prevTasks = await prisma.task.findMany({
      where: { date: { gte: prevStartDate, lte: prevEndDate } }
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const plannedMinutes = tasks.reduce((s, t) => s + (t.estimatedDuration || 0), 0);
    const actualMinutes = tasks.reduce((s, t) => s + (t.actualDuration || 0), 0);
    const totalHours = Number((actualMinutes / 60).toFixed(1));
    const plannedHours = Number((plannedMinutes / 60).toFixed(1));
    const avgHoursPerDay = Number((totalHours / 7).toFixed(1));

    // Daily breakdown for best & worst day
    const dayMap = {};
    for (let i = 0; i < 7; i++) {
      const d = addDays(startDate, i);
      const dayObj = new Date(d + 'T00:00:00');
      const dayName = dayObj.toLocaleDateString('en-US', { weekday: 'long' });
      dayMap[d] = { date: d, dayName, completed: 0, actualMinutes: 0 };
    }

    tasks.forEach(t => {
      if (dayMap[t.date]) {
        if (t.status === 'COMPLETED') dayMap[t.date].completed += 1;
        dayMap[t.date].actualMinutes += t.actualDuration || 0;
      }
    });

    const daysArr = Object.values(dayMap);
    daysArr.sort((a, b) => b.completed - a.completed || b.actualMinutes - a.actualMinutes);
    const bestDay = daysArr[0] || null;
    const worstDay = daysArr[daysArr.length - 1] || null;

    // Most productive category
    const catMap = {};
    tasks.forEach(t => {
      const cat = t.category ? t.category.name : 'General';
      catMap[cat] = (catMap[cat] || 0) + (t.actualDuration || 0);
    });

    let topCategory = 'None';
    let topCatMins = 0;
    for (const [c, m] of Object.entries(catMap)) {
      if (m > topCatMins) {
        topCatMins = m;
        topCategory = c;
      }
    }

    // Comparison with previous week
    const prevCompleted = prevTasks.filter(t => t.status === 'COMPLETED').length;
    const prevActualMinutes = prevTasks.reduce((s, t) => s + (t.actualDuration || 0), 0);
    const prevHours = Number((prevActualMinutes / 60).toFixed(1));
    const taskDiff = completedTasks - prevCompleted;
    const hoursDiff = Number((totalHours - prevHours).toFixed(1));

    res.json({
      success: true,
      data: {
        startDate,
        endDate,
        totalTasks,
        completedTasks,
        completionRate,
        totalHours,
        plannedHours,
        avgHoursPerDay,
        bestDay: bestDay ? `${bestDay.dayName} (${bestDay.completed} completed)` : null,
        worstDay: worstDay ? `${worstDay.dayName} (${worstDay.completed} completed)` : null,
        topCategory: `${topCategory} (${(topCatMins / 60).toFixed(1)}h)`,
        comparison: {
          previousCompleted: prevCompleted,
          taskDiff,
          previousHours: prevHours,
          hoursDiff
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDailyReview,
  saveDailyReview,
  getWeeklyReview
};
