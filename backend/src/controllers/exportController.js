const prisma = require('../lib/prisma');

async function exportData(req, res, next) {
  try {
    const format = (req.query.format || 'json').toLowerCase();

    const [tasks, sessions, reviews, categories] = await Promise.all([
      prisma.task.findMany({
        include: {
          category: true,
          tags: { include: { tag: true } }
        },
        orderBy: { date: 'asc' }
      }),
      prisma.workSession.findMany({
        include: { task: true },
        orderBy: { startTime: 'desc' }
      }),
      prisma.dailyReview.findMany({
        orderBy: { date: 'desc' }
      }),
      prisma.category.findMany()
    ]);

    if (format === 'csv') {
      // Build tasks CSV
      const headers = [
        'ID',
        'Title',
        'Date',
        'Start Time',
        'End Time',
        'Status',
        'Priority',
        'Category',
        'Estimated Duration (min)',
        'Actual Duration (min)',
        'Created At'
      ];

      const rows = tasks.map(t => [
        t.id,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        t.date,
        t.startTime || '',
        t.endTime || '',
        t.status,
        t.priority,
        t.category ? `"${t.category.name}"` : '',
        t.estimatedDuration,
        t.actualDuration,
        t.createdAt.toISOString()
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="worktracker-export.csv"');
      return res.send(csvContent);
    }

    // Default JSON export
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      summary: {
        totalTasks: tasks.length,
        totalSessions: sessions.length,
        totalReviews: reviews.length,
        totalCategories: categories.length
      },
      categories,
      tasks: tasks.map(t => ({
        ...t,
        tags: t.tags ? t.tags.map(tt => tt.tag.name) : []
      })),
      workSessions: sessions,
      dailyReviews: reviews
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="worktracker-export.json"');
    res.json(exportPayload);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  exportData
};
