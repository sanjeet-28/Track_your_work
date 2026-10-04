const analyticsService = require('../services/analyticsService');
const insightService = require('../services/insightService');

async function getOverview(req, res, next) {
  try {
    const { date } = req.query;
    const overview = await analyticsService.getOverview(date);
    res.json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
}

async function getDaily(req, res, next) {
  try {
    const days = req.query.days ? parseInt(req.query.days, 10) : 14;
    const daily = await analyticsService.getDailyCompletion(days);
    res.json({ success: true, data: daily });
  } catch (error) {
    next(error);
  }
}

async function getWeekly(req, res, next) {
  try {
    const weeks = req.query.weeks ? parseInt(req.query.weeks, 10) : 8;
    const weekly = await analyticsService.getWeeklyProductivity(weeks);
    res.json({ success: true, data: weekly });
  } catch (error) {
    next(error);
  }
}

async function getMonthly(req, res, next) {
  try {
    const months = req.query.months ? parseInt(req.query.months, 10) : 6;
    const monthly = await analyticsService.getMonthlyProductivity(months);
    res.json({ success: true, data: monthly });
  } catch (error) {
    next(error);
  }
}

async function getCategories(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const categories = await analyticsService.getCategoryAnalytics(startDate, endDate);
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

async function getHeatmap(req, res, next) {
  try {
    const { year } = req.query;
    const heatmap = await analyticsService.getHeatmapData(year);
    res.json({ success: true, data: heatmap });
  } catch (error) {
    next(error);
  }
}

async function getScore(req, res, next) {
  try {
    const score = await analyticsService.getProductivityScore();
    res.json({ success: true, data: score });
  } catch (error) {
    next(error);
  }
}

async function getInsights(req, res, next) {
  try {
    const insights = await insightService.generateInsights();
    res.json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOverview,
  getDaily,
  getWeekly,
  getMonthly,
  getCategories,
  getHeatmap,
  getScore,
  getInsights
};
