const prisma = require('../lib/prisma');
const { getTodayDateStr, addDays, getWeekBoundaries } = require('../utils/dateUtils');

async function generateInsights() {
  const today = getTodayDateStr();
  const thirtyDaysAgo = addDays(today, -30);

  // Fetch past 30 days tasks
  const tasks = await prisma.task.findMany({
    where: {
      date: { gte: thirtyDaysAgo, lte: today }
    },
    include: {
      category: true,
      workSessions: true
    }
  });

  const insights = [];

  if (tasks.length === 0) {
    return [
      {
        id: 'welcome',
        type: 'info',
        title: 'Start tracking your work',
        message: 'Create and complete tasks this week to unlock personalized productivity insights.',
        metric: null
      }
    ];
  }

  // 1. Week-over-week completion comparison
  const { startDate: currentWeekStart, endDate: currentWeekEnd } = getWeekBoundaries(today);
  const prevWeekStart = addDays(currentWeekStart, -7);
  const prevWeekEnd = addDays(currentWeekEnd, -7);

  const currentWeekTasks = tasks.filter(t => t.date >= currentWeekStart && t.date <= currentWeekEnd);
  const prevWeekTasks = tasks.filter(t => t.date >= prevWeekStart && t.date <= prevWeekEnd);

  const currentCompleted = currentWeekTasks.filter(t => t.status === 'COMPLETED').length;
  const prevCompleted = prevWeekTasks.filter(t => t.status === 'COMPLETED').length;

  if (prevCompleted > 0) {
    const diffPct = Math.round(((currentCompleted - prevCompleted) / prevCompleted) * 100);
    if (diffPct > 0) {
      insights.push({
        id: 'wow-increase',
        type: 'positive',
        title: 'Week-over-Week Momentum',
        message: `You completed ${diffPct}% more work this week than last week (${currentCompleted} vs ${prevCompleted} tasks).`,
        metric: `+${diffPct}%`
      });
    } else if (diffPct < 0) {
      insights.push({
        id: 'wow-decrease',
        type: 'neutral',
        title: 'Pacing Check',
        message: `Task completions are down ${Math.abs(diffPct)}% compared to last week. Consider focusing on your top 3 daily priorities.`,
        metric: `${diffPct}%`
      });
    }
  }

  // 2. Most productive weekday
  const dayTotals = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDayNames = {
    Sun: 'Sunday',
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday'
  };

  tasks.filter(t => t.status === 'COMPLETED').forEach(t => {
    const d = new Date(t.date + 'T00:00:00');
    const day = dayNames[d.getDay()];
    dayTotals[day] += (t.actualDuration || t.estimatedDuration || 60);
  });

  let bestDay = 'Mon';
  let maxTime = 0;
  for (const [day, time] of Object.entries(dayTotals)) {
    if (time > maxTime) {
      maxTime = time;
      bestDay = day;
    }
  }

  if (maxTime > 0) {
    const hours = (maxTime / 60).toFixed(1);
    insights.push({
      id: 'best-day',
      type: 'positive',
      title: 'Peak Productivity Day',
      message: `Your most productive day is ${fullDayNames[bestDay]}, with over ${hours} hours of deep work logged in the past month.`,
      metric: fullDayNames[bestDay]
    });
  }

  // 3. Morning vs Afternoon completion rate
  const morningTasks = tasks.filter(t => t.startTime && parseInt(t.startTime.split(':')[0], 10) < 12);
  if (morningTasks.length >= 3) {
    const morningCompleted = morningTasks.filter(t => t.status === 'COMPLETED').length;
    const morningRate = Math.round((morningCompleted / morningTasks.length) * 100);

    insights.push({
      id: 'morning-focus',
      type: morningRate >= 70 ? 'positive' : 'info',
      title: 'Morning Momentum',
      message: `You usually complete ${morningRate}% of tasks scheduled before 12:00 PM. ${morningRate >= 70 ? 'Your morning focus is exceptional!' : 'Consider scheduling smaller warm-up tasks early.'}`,
      metric: `${morningRate}%`
    });
  }

  // 4. Estimation bias (underestimate / overestimate)
  const tasksWithBothTimes = tasks.filter(t => t.status === 'COMPLETED' && t.estimatedDuration > 0 && t.actualDuration > 0);
  if (tasksWithBothTimes.length >= 3) {
    const diffs = tasksWithBothTimes.map(t => t.actualDuration - t.estimatedDuration);
    const avgDiff = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);

    if (avgDiff > 5) {
      insights.push({
        id: 'estimation-under',
        type: 'warning',
        title: 'Time Estimation Bias',
        message: `You tend to underestimate tasks by approximately ${avgDiff} minutes. Adding buffer time between blocks can prevent schedule slips.`,
        metric: `+${avgDiff}m`
      });
    } else if (avgDiff < -5) {
      insights.push({
        id: 'estimation-over',
        type: 'positive',
        title: 'Efficient Execution',
        message: `You tend to finish tasks approximately ${Math.abs(avgDiff)} minutes faster than planned!`,
        metric: `-${Math.abs(avgDiff)}m`
      });
    } else {
      insights.push({
        id: 'estimation-accurate',
        type: 'positive',
        title: 'Accurate Time Forecasting',
        message: 'Your estimated task durations closely match your actual working time within 5 minutes.',
        metric: 'Spot on'
      });
    }
  }

  // 5. Category focus
  const categoryHours = {};
  let totalTrackedMinutes = 0;
  tasks.forEach(t => {
    const cat = t.category ? t.category.name : 'General';
    const dur = t.actualDuration || t.estimatedDuration || 0;
    categoryHours[cat] = (categoryHours[cat] || 0) + dur;
    totalTrackedMinutes += dur;
  });

  let topCategory = null;
  let topCategoryMinutes = 0;
  for (const [cat, mins] of Object.entries(categoryHours)) {
    if (mins > topCategoryMinutes) {
      topCategoryMinutes = mins;
      topCategory = cat;
    }
  }

  if (topCategory && totalTrackedMinutes > 0) {
    const pct = Math.round((topCategoryMinutes / totalTrackedMinutes) * 100);
    insights.push({
      id: 'category-focus',
      type: 'info',
      title: 'Primary Domain Focus',
      message: `${topCategory} accounts for ${pct}% of your logged working time over the past 30 days.`,
      metric: `${pct}% ${topCategory}`
    });
  }

  return insights;
}

module.exports = {
  generateInsights
};
