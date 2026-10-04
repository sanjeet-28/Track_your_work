const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { validateTaskCreate, validateTaskUpdate } = require('../middleware/validate');

// Overdue and upcoming queries before :id to prevent param collision
router.get('/overdue', taskController.getOverdue);
router.get('/upcoming', taskController.getUpcoming);

router.get('/', taskController.getTasks);
router.post('/', validateTaskCreate, taskController.createTask);

router.get('/:id', taskController.getTaskById);
router.put('/:id', validateTaskUpdate, taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

router.patch('/:id/status', taskController.updateStatus);
router.patch('/:id/reschedule', taskController.reschedule);
router.post('/:id/duplicate', taskController.duplicate);

module.exports = router;
