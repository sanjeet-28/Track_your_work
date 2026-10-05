const prisma = require('../lib/prisma');
const { getTodayDateStr, calculateDurationMinutes, addDays } = require('../utils/dateUtils');
const { detectCourseCode, detectTaskType, getTagForTaskType, getCourseColor } = require('../utils/detectionUtils');

const taskInclude = {
  category: true,
  course: true,
  tags: {
    include: {
      tag: true
    }
  },
  workSessions: {
    orderBy: {
      startTime: 'desc'
    }
  }
};

function formatTask(task) {
  if (!task) return null;
  return {
    ...task,
    course: task.course || null,
    tags: task.tags ? task.tags.map(tt => tt.tag) : []
  };
}

async function getTasks(filters = {}) {
  const {
    date,
    startDate,
    endDate,
    status,
    priority,
    categoryId,
    courseId,
    courseCode,
    taskType,
    tag,
    search,
    sortBy = 'startTime',
    sortOrder = 'asc',
    page,
    limit
  } = filters;

  const where = {};

  if (date) {
    where.date = date;
  } else if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  if (status) {
    where.status = status.toUpperCase();
  }

  if (priority) {
    where.priority = priority.toUpperCase();
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (courseId) {
    where.courseId = courseId;
  } else if (courseCode) {
    where.course = { code: courseCode.toUpperCase() };
  }

  if (taskType) {
    where.taskType = taskType;
  }

  if (tag) {
    where.tags = {
      some: {
        tag: {
          name: tag
        }
      }
    };
  }

  if (search) {
    where.title = { contains: search };
  }

  const orderBy = [];
  if (sortBy === 'priority') {
    // We order by date then priority/startTime
    orderBy.push({ date: sortOrder });
  } else if (sortBy === 'duration') {
    orderBy.push({ estimatedDuration: sortOrder });
  } else if (sortBy === 'date') {
    orderBy.push({ date: sortOrder });
    orderBy.push({ startTime: 'asc' });
  } else {
    // Default: date then startTime
    orderBy.push({ date: 'asc' });
    orderBy.push({ startTime: sortOrder });
  }

  const queryOptions = {
    where,
    include: taskInclude,
    orderBy
  };

  if (page && limit) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    queryOptions.skip = (pageNum - 1) * pageSize;
    queryOptions.take = pageSize;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany(queryOptions),
      prisma.task.count({ where })
    ]);

    return {
      tasks: tasks.map(formatTask),
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  const tasks = await prisma.task.findMany(queryOptions);
  return tasks.map(formatTask);
}

async function getTaskById(id) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: taskInclude
  });
  return formatTask(task);
}

async function createTask(data) {
  const {
    title,
    date = getTodayDateStr(),
    startTime,
    endTime,
    status = 'TODO',
    priority = 'MEDIUM',
    categoryId,
    courseId,
    taskType,
    tags = [], // array of tag names or IDs
    estimatedDuration,
    isRecurring = false,
    recurrenceType = 'NONE',
    recurrenceDays
  } = data;



  // Auto calculate duration if start & end time provided and not explicitly given
  let calculatedDuration = estimatedDuration !== undefined ? Number(estimatedDuration) : undefined;
  if (calculatedDuration === undefined && startTime && endTime) {
    calculatedDuration = calculateDurationMinutes(startTime, endTime);
  }

  // Verify category if provided
  let validCategoryId = null;
  if (categoryId && typeof categoryId === 'string' && categoryId.trim()) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId.trim() } });
    if (cat) validCategoryId = cat.id;
  }

  // Automatic course detection
  let finalCourseId = null;
  const detectedCode = detectCourseCode(title);
  if (detectedCode) {
    const courseRecord = await prisma.course.upsert({
      where: { code: detectedCode },
      update: {},
      create: {
        code: detectedCode,
        name: detectedCode,
        color: getCourseColor(detectedCode)
      }
    });
    finalCourseId = courseRecord.id;
  } else if (courseId && typeof courseId === 'string' && courseId.trim()) {
    const course = await prisma.course.findUnique({ where: { id: courseId.trim() } });
    if (course) finalCourseId = course.id;
  }

  // Automatic task type detection
  let finalTaskType = taskType || null;
  const detectedType = detectTaskType(title);
  if (detectedType) {
    finalTaskType = detectedType;
  }

  // Connect or create tags (deduplicated), including detected task type tag
  const tagsToProcess = Array.isArray(tags) ? [...tags] : [];
  if (finalTaskType) {
    const suggestedTag = getTagForTaskType(finalTaskType);
    if (suggestedTag && !tagsToProcess.some(t => (typeof t === 'string' ? t.toLowerCase() : t?.name?.toLowerCase()) === suggestedTag.toLowerCase())) {
      tagsToProcess.push(suggestedTag);
    }
  }

  const taskTagCreates = [];
  const processedTagNames = new Set();
  for (const tagItem of tagsToProcess) {
    if (!tagItem) continue;
    const tagName = typeof tagItem === 'string' ? tagItem.trim() : tagItem?.name?.trim();
    if (!tagName || processedTagNames.has(tagName.toLowerCase())) continue;
    processedTagNames.add(tagName.toLowerCase());

    const tagRecord = await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName }
    });

    taskTagCreates.push({
      tag: { connect: { id: tagRecord.id } }
    });
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      status,
      priority,
      categoryId: validCategoryId,
      courseId: finalCourseId,
      taskType: finalTaskType,
      estimatedDuration: Math.max(0, calculatedDuration || 0),
      isRecurring: Boolean(isRecurring),
      recurrenceType: recurrenceType || 'NONE',
      recurrenceDays: recurrenceDays || null,
      completedAt: status === 'COMPLETED' ? new Date() : null,
      tags: taskTagCreates.length > 0 ? { create: taskTagCreates } : undefined
    },
    include: taskInclude
  });

  return formatTask(task);
}

async function updateTask(id, data) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  const {
    title,
    date,
    startTime,
    endTime,
    status,
    priority,
    categoryId,
    courseId,
    taskType,
    tags,
    estimatedDuration,
    isRecurring,
    recurrenceType,
    recurrenceDays
  } = data;

  const updateData = {};

  if (title !== undefined) {
    updateData.title = title.trim();
    // Auto detect course if not explicitly set
    if (courseId === undefined) {
      const detectedCode = detectCourseCode(title);
      if (detectedCode) {
        const courseRecord = await prisma.course.upsert({
          where: { code: detectedCode },
          update: {},
          create: {
            code: detectedCode,
            name: detectedCode,
            color: getCourseColor(detectedCode)
          }
        });
        updateData.courseId = courseRecord.id;
      }
    }
    // Auto detect taskType if not explicitly set
    if (taskType === undefined) {
      const detectedType = detectTaskType(title);
      if (detectedType) {
        updateData.taskType = detectedType;
      }
    }
  }

  if (courseId !== undefined) {
    updateData.courseId = courseId || null;
  }

  if (taskType !== undefined) {
    updateData.taskType = taskType || null;
  }

  if (date !== undefined) updateData.date = date;
  if (startTime !== undefined) updateData.startTime = startTime || null;
  if (endTime !== undefined) updateData.endTime = endTime || null;
  if (priority !== undefined) updateData.priority = priority;

  if (status !== undefined) {
    updateData.status = status;
    if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    } else if (status !== 'COMPLETED' && existing.status === 'COMPLETED') {
      updateData.completedAt = null;
    }
  }

  if (categoryId !== undefined) {
    if (categoryId && typeof categoryId === 'string' && categoryId.trim()) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId.trim() } });
      updateData.categoryId = cat ? cat.id : null;
    } else {
      updateData.categoryId = null;
    }
  }

  if (isRecurring !== undefined) updateData.isRecurring = Boolean(isRecurring);
  if (recurrenceType !== undefined) updateData.recurrenceType = recurrenceType;
  if (recurrenceDays !== undefined) updateData.recurrenceDays = recurrenceDays || null;

  // Recalculate duration if start/end times updated or specified
  const effectiveStart = startTime !== undefined ? startTime : existing.startTime;
  const effectiveEnd = endTime !== undefined ? endTime : existing.endTime;



  if (estimatedDuration !== undefined) {
    updateData.estimatedDuration = Math.max(0, Number(estimatedDuration));
  } else if ((startTime !== undefined || endTime !== undefined) && effectiveStart && effectiveEnd) {
    updateData.estimatedDuration = calculateDurationMinutes(effectiveStart, effectiveEnd);
  }

  // Handle tags update if provided (deduplicated)
  if (Array.isArray(tags)) {
    // Delete existing task tags
    await prisma.taskTag.deleteMany({ where: { taskId: id } });

    const processedTagNames = new Set();
    for (const tagItem of tags) {
      if (!tagItem) continue;
      const tagName = typeof tagItem === 'string' ? tagItem.trim() : tagItem?.name?.trim();
      if (!tagName || processedTagNames.has(tagName.toLowerCase())) continue;
      processedTagNames.add(tagName.toLowerCase());

      const tagRecord = await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName }
      });

      await prisma.taskTag.create({
        data: {
          taskId: id,
          tagId: tagRecord.id
        }
      });
    }
  }

  const updated = await prisma.task.update({
    where: { id },
    data: updateData,
    include: taskInclude
  });

  return formatTask(updated);
}

async function deleteTask(id) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.task.delete({ where: { id } });
  return { success: true, id };
}

async function updateTaskStatus(id, status) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  const completedAt = status === 'COMPLETED' ? new Date() : (status === 'TODO' || status === 'IN_PROGRESS' ? null : existing.completedAt);

  const updated = await prisma.task.update({
    where: { id },
    data: {
      status,
      completedAt
    },
    include: taskInclude
  });

  return formatTask(updated);
}

async function rescheduleTask(id, { date, startTime, endTime }) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  const updateData = { date };

  if (startTime !== undefined) updateData.startTime = startTime || null;
  if (endTime !== undefined) updateData.endTime = endTime || null;

  // If new start & end time provided, recalculate duration and validate
  const effectiveStart = startTime !== undefined ? startTime : existing.startTime;
  const effectiveEnd = endTime !== undefined ? endTime : existing.endTime;

  if (effectiveStart && effectiveEnd) {
    const [sH, sM] = effectiveStart.split(':').map(Number);
    const [eH, eM] = effectiveEnd.split(':').map(Number);
    if (eH * 60 + eM < sH * 60 + sM) {
      const error = new Error('End time cannot be earlier than start time');
      error.statusCode = 400;
      throw error;
    }
    updateData.estimatedDuration = calculateDurationMinutes(effectiveStart, effectiveEnd);
  }

  const updated = await prisma.task.update({
    where: { id },
    data: updateData,
    include: taskInclude
  });

  return formatTask(updated);
}

async function duplicateTask(id, targetDate) {
  const original = await prisma.task.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } }
    }
  });

  if (!original) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  const newTask = await prisma.task.create({
    data: {
      title: `${original.title} (Copy)`,
      date: targetDate || original.date,
      startTime: original.startTime,
      endTime: original.endTime,
      status: 'TODO',
      priority: original.priority,
      categoryId: original.categoryId,
      estimatedDuration: original.estimatedDuration,
      actualDuration: 0,
      isRecurring: original.isRecurring,
      recurrenceType: original.recurrenceType,
      recurrenceDays: original.recurrenceDays,
      tags: {
        create: original.tags.map(t => ({
          tag: { connect: { id: t.tagId } }
        }))
      }
    },
    include: taskInclude
  });

  return formatTask(newTask);
}

async function getOverdueTasks() {
  const today = getTodayDateStr();
  const tasks = await prisma.task.findMany({
    where: {
      date: { lt: today },
      status: {
        in: ['TODO', 'IN_PROGRESS']
      }
    },
    include: taskInclude,
    orderBy: [
      { date: 'asc' },
      { priority: 'desc' }
    ]
  });

  return tasks.map(formatTask);
}

async function getUpcomingTasks(days = 7) {
  const today = getTodayDateStr();
  const endDate = addDays(today, days);

  const tasks = await prisma.task.findMany({
    where: {
      date: {
        gt: today,
        lte: endDate
      }
    },
    include: taskInclude,
    orderBy: [
      { date: 'asc' },
      { startTime: 'asc' }
    ]
  });

  // Group by date
  const grouped = {};
  for (let i = 1; i <= days; i++) {
    const d = addDays(today, i);
    grouped[d] = [];
  }

  tasks.forEach(t => {
    const formatted = formatTask(t);
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(formatted);
  });

  return grouped;
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  rescheduleTask,
  duplicateTask,
  getOverdueTasks,
  getUpcomingTasks
};
