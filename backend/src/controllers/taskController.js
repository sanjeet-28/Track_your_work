const taskService = require('../services/taskService');

async function getTasks(req, res, next) {
  try {
    const tasks = await taskService.getTasks(req.query);
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
}

async function getTaskById(req, res, next) {
  try {
    const task = await taskService.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

async function createTask(req, res, next) {
  try {
    const task = await taskService.createTask(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    const task = await taskService.updateTask(req.params.id, req.body);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    const result = await taskService.deleteTask(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }
    const task = await taskService.updateTaskStatus(req.params.id, status.toUpperCase());
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

async function reschedule(req, res, next) {
  try {
    const { date, startTime, endTime } = req.body;
    if (!date) {
      return res.status(400).json({ success: false, error: 'Target date is required' });
    }
    const task = await taskService.rescheduleTask(req.params.id, { date, startTime, endTime });
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

async function duplicate(req, res, next) {
  try {
    const { date } = req.body;
    const task = await taskService.duplicateTask(req.params.id, date);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

async function getOverdue(req, res, next) {
  try {
    const overdue = await taskService.getOverdueTasks();
    res.json({ success: true, data: overdue });
  } catch (error) {
    next(error);
  }
}

async function getUpcoming(req, res, next) {
  try {
    const days = req.query.days ? parseInt(req.query.days, 10) : 7;
    const upcoming = await taskService.getUpcomingTasks(days);
    res.json({ success: true, data: upcoming });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateStatus,
  reschedule,
  duplicate,
  getOverdue,
  getUpcoming
};
