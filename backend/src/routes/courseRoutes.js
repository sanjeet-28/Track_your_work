const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// Analytics routes
router.get('/analytics/overview', courseController.getCourseAnalyticsOverview);
router.get('/analytics/daily', courseController.getDailyCourseBreakdown);

// CRUD routes
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.get('/:id/heatmap', courseController.getCourseHeatmap);
router.post('/', courseController.createCourse);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

module.exports = router;
