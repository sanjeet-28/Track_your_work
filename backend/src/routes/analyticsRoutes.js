const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/overview', analyticsController.getOverview);
router.get('/daily', analyticsController.getDaily);
router.get('/weekly', analyticsController.getWeekly);
router.get('/monthly', analyticsController.getMonthly);
router.get('/categories', analyticsController.getCategories);
router.get('/heatmap', analyticsController.getHeatmap);
router.get('/score', analyticsController.getScore);
router.get('/insights', analyticsController.getInsights);

module.exports = router;
