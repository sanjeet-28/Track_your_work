const prisma = require('../lib/prisma');

async function getActiveSession() {
  const active = await prisma.workSession.findFirst({
    where: { endTime: null },
    include: {
      task: {
        include: {
          category: true,
          tags: { include: { tag: true } }
        }
      }
    },
    orderBy: { startTime: 'desc' }
  });

  if (!active) return null;

  return {
    ...active,
    task: {
      ...active.task,
      tags: active.task.tags ? active.task.tags.map(tt => tt.tag) : []
    }
  };
}

async function startWorkSession(taskId, notes = null) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  // Stop any other currently running session across the app to prevent double counting
  const runningSessions = await prisma.workSession.findMany({
    where: { endTime: null }
  });

  for (const session of runningSessions) {
    const now = new Date();
    const durationMins = Math.max(1, Math.round((now.getTime() - session.startTime.getTime()) / 60000));
    await prisma.workSession.update({
      where: { id: session.id },
      data: {
        endTime: now,
        duration: durationMins
      }
    });

    // Update that task's actualDuration
    const allSessions = await prisma.workSession.findMany({
      where: { taskId: session.taskId, endTime: { not: null } }
    });
    const totalDuration = allSessions.reduce((acc, s) => acc + s.duration, 0);
    await prisma.task.update({
      where: { id: session.taskId },
      data: { actualDuration: totalDuration, actualEndTime: now }
    });
  }

  const now = new Date();

  // Create new active session
  const newSession = await prisma.workSession.create({
    data: {
      taskId,
      startTime: now,
      notes: notes || null
    }
  });

  // Set task status to IN_PROGRESS if TODO, and record actualStartTime if not already set
  const taskUpdateData = {};
  if (task.status === 'TODO') {
    taskUpdateData.status = 'IN_PROGRESS';
  }
  if (!task.actualStartTime) {
    taskUpdateData.actualStartTime = now;
  }

  if (Object.keys(taskUpdateData).length > 0) {
    await prisma.task.update({
      where: { id: taskId },
      data: taskUpdateData
    });
  }

  return {
    session: newSession,
    task: await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        category: true,
        tags: { include: { tag: true } }
      }
    })
  };
}

async function stopWorkSession(taskId, notes = null) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  // Find active session for this task
  const activeSession = await prisma.workSession.findFirst({
    where: { taskId, endTime: null },
    orderBy: { startTime: 'desc' }
  });

  if (!activeSession) {
    const error = new Error('No active work session found for this task');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const durationMins = Math.max(1, Math.round((now.getTime() - activeSession.startTime.getTime()) / 60000));

  const updatedSession = await prisma.workSession.update({
    where: { id: activeSession.id },
    data: {
      endTime: now,
      duration: durationMins,
      notes: notes !== null ? notes : activeSession.notes
    }
  });

  // Sum all completed sessions for this task
  const allSessions = await prisma.workSession.findMany({
    where: { taskId, endTime: { not: null } }
  });
  const totalActualMinutes = allSessions.reduce((sum, s) => sum + s.duration, 0);

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      actualDuration: totalActualMinutes,
      actualEndTime: now
    },
    include: {
      category: true,
      tags: { include: { tag: true } },
      workSessions: { orderBy: { startTime: 'desc' } }
    }
  });

  return {
    session: updatedSession,
    task: {
      ...updatedTask,
      tags: updatedTask.tags ? updatedTask.tags.map(tt => tt.tag) : []
    }
  };
}

async function getTaskSessions(taskId) {
  const sessions = await prisma.workSession.findMany({
    where: { taskId },
    orderBy: { startTime: 'desc' }
  });
  return sessions;
}

async function deleteSession(sessionId) {
  const session = await prisma.workSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    const error = new Error('Work session not found');
    error.statusCode = 404;
    throw error;
  }

  const taskId = session.taskId;
  await prisma.workSession.delete({ where: { id: sessionId } });

  // Recalculate total duration
  const remaining = await prisma.workSession.findMany({
    where: { taskId, endTime: { not: null } }
  });
  const totalDuration = remaining.reduce((sum, s) => sum + s.duration, 0);

  await prisma.task.update({
    where: { id: taskId },
    data: { actualDuration: totalDuration }
  });

  return { success: true, sessionId, taskId, newActualDuration: totalDuration };
}

module.exports = {
  getActiveSession,
  startWorkSession,
  stopWorkSession,
  getTaskSessions,
  deleteSession
};
