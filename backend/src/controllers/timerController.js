const timerService = require('../services/timerService');

async function getActiveSession(req, res, next) {
  try {
    const session = await timerService.getActiveSession();
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
}

async function startTimer(req, res, next) {
  try {
    const { taskId } = req.params;
    const { notes } = req.body;
    const result = await timerService.startWorkSession(taskId, notes);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function stopTimer(req, res, next) {
  try {
    const { taskId } = req.params;
    const { notes } = req.body;
    const result = await timerService.stopWorkSession(taskId, notes);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getTaskSessions(req, res, next) {
  try {
    const { taskId } = req.params;
    const sessions = await timerService.getTaskSessions(taskId);
    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
}

async function deleteSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const result = await timerService.deleteSession(sessionId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getActiveSession,
  startTimer,
  stopTimer,
  getTaskSessions,
  deleteSession
};
