const prisma = require('../lib/prisma');

async function getSettings(req, res, next) {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { id: 'default' }
      });
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

async function updateSettings(req, res, next) {
  try {
    const {
      theme,
      compactMode,
      defaultTaskDuration,
      workingHoursStart,
      workingHoursEnd,
      weekStartsOn,
      defaultCalendarView,
      enableNotifications,
      reminderMinutes
    } = req.body;

    const updateData = {};
    if (theme !== undefined) updateData.theme = theme;
    if (compactMode !== undefined) updateData.compactMode = Boolean(compactMode);
    if (defaultTaskDuration !== undefined) updateData.defaultTaskDuration = parseInt(defaultTaskDuration, 10);
    if (workingHoursStart !== undefined) updateData.workingHoursStart = workingHoursStart;
    if (workingHoursEnd !== undefined) updateData.workingHoursEnd = workingHoursEnd;
    if (weekStartsOn !== undefined) updateData.weekStartsOn = parseInt(weekStartsOn, 10);
    if (defaultCalendarView !== undefined) updateData.defaultCalendarView = defaultCalendarView;
    if (enableNotifications !== undefined) updateData.enableNotifications = Boolean(enableNotifications);
    if (reminderMinutes !== undefined) updateData.reminderMinutes = parseInt(reminderMinutes, 10);

    const settings = await prisma.userSettings.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        ...updateData
      }
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettings,
  updateSettings
};
