const courseService = require('../services/courseService');
const { getTodayDateStr } = require('../utils/dateUtils');

async function getAllCourses(req, res, next) {
  try {
    const data = await courseService.getAllCourses();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getCourseById(req, res, next) {
  try {
    const course = await courseService.getCourseById(req.params.id);
    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
}

async function createCourse(req, res, next) {
  try {
    const course = await courseService.createCourse(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
}

async function updateCourse(req, res, next) {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body);
    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
}

async function deleteCourse(req, res, next) {
  try {
    const deleteTasks = req.query.deleteTasks === 'true';
    const result = await courseService.deleteCourse(req.params.id, deleteTasks);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getCourseHeatmap(req, res, next) {
  try {
    const days = req.query.days ? parseInt(req.query.days, 10) : 90;
    const heatmap = await courseService.getCourseHeatmap(req.params.id, days);
    res.json({ success: true, data: heatmap });
  } catch (err) {
    next(err);
  }
}

async function getDailyCourseBreakdown(req, res, next) {
  try {
    const dateStr = req.query.date || getTodayDateStr();
    const data = await courseService.getDailyCourseBreakdown(dateStr);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getCourseAnalyticsOverview(req, res, next) {
  try {
    const data = await courseService.getCourseAnalyticsOverview();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
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
