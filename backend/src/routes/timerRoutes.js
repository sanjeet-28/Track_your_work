const express = require('express');
const router = express.Router();
const timerController = require('../controllers/timerController');

// Active session across all tasks
router.get('/active', timerController.getActiveSession);

// Task-specific work sessions
router.post('/tasks/:taskId/start', timerController.startTimer);
router.post('/tasks/:taskId/stop', timerController.stopTimer);
router.get('/tasks/:taskId/sessions', timerController.getTaskSessions);

// Direct session operations
router.delete('/sessions/:sessionId', timerController.deleteSession);

module.exports = router;
