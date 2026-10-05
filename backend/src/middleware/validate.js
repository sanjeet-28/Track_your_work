const { isValidDateStr, isValidTimeStr } = require('../utils/dateUtils');

const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const VALID_RECURRENCES = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM_DAYS'];

function validateTaskCreate(req, res, next) {
  const { title, date, startTime, endTime, priority, status, recurrenceType } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Task title is required and cannot be empty'
    });
  }

  if (title.length > 255) {
    return res.status(400).json({
      success: false,
      error: 'Task title cannot exceed 255 characters'
    });
  }

  if (date && !isValidDateStr(date)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid date format. Expected YYYY-MM-DD'
    });
  }

  if (startTime && !isValidTimeStr(startTime)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid startTime format. Expected HH:mm (24-hour)'
    });
  }

  if (endTime && !isValidTimeStr(endTime)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid endTime format. Expected HH:mm (24-hour)'
    });
  }

  if (startTime && endTime) {
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    if (eH * 60 + eM < sH * 60 + sM) {
      return res.status(400).json({
        success: false,
        error: 'End time cannot be earlier than start time'
      });
    }
  }

  if (priority && !VALID_PRIORITIES.includes(priority.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`
    });
  }

  if (status && !VALID_STATUSES.includes(status.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
    });
  }

  if (recurrenceType && !VALID_RECURRENCES.includes(recurrenceType.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid recurrenceType. Must be one of: ${VALID_RECURRENCES.join(', ')}`
    });
  }

  next();
}

function validateTaskUpdate(req, res, next) {
  const { title, date, startTime, endTime, priority, status, recurrenceType } = req.body;

  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    return res.status(400).json({
      success: false,
      error: 'Task title cannot be empty'
    });
  }

  if (date && !isValidDateStr(date)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid date format. Expected YYYY-MM-DD'
    });
  }

  if (startTime && !isValidTimeStr(startTime)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid startTime format. Expected HH:mm (24-hour)'
    });
  }

  if (endTime && !isValidTimeStr(endTime)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid endTime format. Expected HH:mm (24-hour)'
    });
  }

  if (startTime && endTime) {
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    if (eH * 60 + eM < sH * 60 + sM) {
      return res.status(400).json({
        success: false,
        error: 'End time cannot be earlier than start time'
      });
    }
  }

  if (priority && !VALID_PRIORITIES.includes(priority.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`
    });
  }

  if (status && !VALID_STATUSES.includes(status.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
    });
  }

  if (recurrenceType && !VALID_RECURRENCES.includes(recurrenceType.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid recurrenceType. Must be one of: ${VALID_RECURRENCES.join(', ')}`
    });
  }

  next();
}

module.exports = {
  validateTaskCreate,
  validateTaskUpdate,
  VALID_STATUSES,
  VALID_PRIORITIES
};
