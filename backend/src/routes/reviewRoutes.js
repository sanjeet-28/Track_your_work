const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.get('/daily', reviewController.getDailyReview);
router.get('/daily/:date', reviewController.getDailyReview);
router.post('/daily', reviewController.saveDailyReview);

router.get('/weekly', reviewController.getWeeklyReview);
router.get('/weekly/:startDate', reviewController.getWeeklyReview);

module.exports = router;
