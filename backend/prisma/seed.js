const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Coding', color: '#6366f1', icon: 'Code' },
  { name: 'DSA', color: '#ec4899', icon: 'Cpu' },
  { name: 'College', color: '#3b82f6', icon: 'GraduationCap' },
  { name: 'Research', color: '#8b5cf6', icon: 'FlaskConical' },
  { name: 'Internship', color: '#10b981', icon: 'Briefcase' },
  { name: 'Personal', color: '#f59e0b', icon: 'User' },
  { name: 'Exercise', color: '#14b8a6', icon: 'Dumbbell' },
  { name: 'Other', color: '#64748b', icon: 'Folder' },
];

const defaultTags = [
  { name: 'leetcode', color: '#f97316' },
  { name: 'backend', color: '#06b6d4' },
  { name: 'frontend', color: '#3b82f6' },
  { name: 'urgent', color: '#ef4444' },
  { name: 'deepwork', color: '#8b5cf6' },
  { name: 'review', color: '#10b981' }
];

async function seed() {
  console.log('Seeding initial data...');

  // Ensure UserSettings
  await prisma.userSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      theme: 'system',
      compactMode: false,
      defaultTaskDuration: 60,
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
      weekStartsOn: 1,
      defaultCalendarView: 'week',
      enableNotifications: true,
      reminderMinutes: 10
    }
  });

  // Seed Categories
  const categoryMap = {};
  for (const cat of defaultCategories) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: { color: cat.color, icon: cat.icon },
      create: cat
    });
    categoryMap[cat.name] = created.id;
  }

  // Seed Tags
  const tagMap = {};
  for (const t of defaultTags) {
    const created = await prisma.tag.upsert({
      where: { name: t.name },
      update: { color: t.color },
      create: t
    });
    tagMap[t.name] = created.id;
  }

  // Check if tasks already exist
  const existingCount = await prisma.task.count();
  if (existingCount === 0) {
    console.log('Populating initial sample tasks and work sessions...');
    
    // Helper to get YYYY-MM-DD for relative offset
    const today = new Date();
    const getDateStr = (offsetDays) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offsetDays);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const sampleTasks = [
      // Past days (for analytics, completion rate, heatmap)
      {
        title: 'Graph Traversal Algorithms practice',
        date: getDateStr(-2),
        startTime: '09:30',
        endTime: '11:30',
        estimatedDuration: 120,
        actualDuration: 110,
        status: 'COMPLETED',
        priority: 'HIGH',
        categoryId: categoryMap['DSA'],
        completedAt: new Date(Date.now() - 2 * 86400000),
        sessions: [
          { duration: 110, notes: 'Completed 3 leetcode medium problems' }
        ],
        tags: ['leetcode', 'deepwork']
      },
      {
        title: 'Backend API authentication refactor',
        date: getDateStr(-2),
        startTime: '14:00',
        endTime: '16:00',
        estimatedDuration: 120,
        actualDuration: 135,
        status: 'COMPLETED',
        priority: 'URGENT',
        categoryId: categoryMap['Coding'],
        completedAt: new Date(Date.now() - 2 * 86400000 + 7200000),
        sessions: [
          { duration: 75, notes: 'Designed token rotation' },
          { duration: 60, notes: 'Tested edge cases' }
        ],
        tags: ['backend', 'urgent']
      },
      {
        title: 'Operating Systems chapter 4 summary',
        date: getDateStr(-1),
        startTime: '10:00',
        endTime: '12:00',
        estimatedDuration: 120,
        actualDuration: 105,
        status: 'COMPLETED',
        priority: 'MEDIUM',
        categoryId: categoryMap['College'],
        completedAt: new Date(Date.now() - 1 * 86400000),
        sessions: [
          { duration: 105, notes: 'Prepared lecture notes' }
        ],
        tags: ['deepwork']
      },
      {
        title: 'Read Transformer Architecture paper',
        date: getDateStr(-1),
        startTime: '15:00',
        endTime: '16:30',
        estimatedDuration: 90,
        actualDuration: 80,
        status: 'COMPLETED',
        priority: 'HIGH',
        categoryId: categoryMap['Research'],
        completedAt: new Date(Date.now() - 1 * 86400000 + 5400000),
        sessions: [
          { duration: 80, notes: 'Read sections 1-4' }
        ],
        tags: ['research']
      },

      // Today's tasks (rich interactive set)
      {
        title: 'DSA Practice: Dynamic Programming Patterns',
        date: getDateStr(0),
        startTime: '09:00',
        endTime: '10:30',
        estimatedDuration: 90,
        actualDuration: 90,
        status: 'COMPLETED',
        priority: 'HIGH',
        categoryId: categoryMap['DSA'],
        completedAt: new Date(),
        sessions: [
          { duration: 90, notes: 'Solved 0/1 knapsack and coin change' }
        ],
        tags: ['leetcode', 'deepwork']
      },
      {
        title: 'Database Assignment: Normalization & Indexing',
        date: getDateStr(0),
        startTime: '11:00',
        endTime: '12:30',
        estimatedDuration: 90,
        actualDuration: 75,
        status: 'COMPLETED',
        priority: 'URGENT',
        categoryId: categoryMap['College'],
        completedAt: new Date(),
        sessions: [
          { duration: 75, notes: 'Submitted assignment PDF' }
        ],
        tags: ['urgent']
      },
      {
        title: 'Machine Learning Experiment: Fine-tuning BERT',
        date: getDateStr(0),
        startTime: '14:00',
        endTime: '15:30',
        estimatedDuration: 90,
        actualDuration: 45,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        categoryId: categoryMap['Research'],
        actualStartTime: new Date(Date.now() - 45 * 60000),
        sessions: [
          { duration: 45, notes: 'Started baseline training run' }
        ],
        tags: ['research', 'deepwork']
      },
      {
        title: 'Project Architecture: Daily Work Tracker REST API',
        date: getDateStr(0),
        startTime: '16:00',
        endTime: '18:00',
        estimatedDuration: 120,
        actualDuration: 0,
        status: 'TODO',
        priority: 'URGENT',
        categoryId: categoryMap['Coding'],
        tags: ['backend']
      },
      {
        title: 'Evening Workout & Cardio',
        date: getDateStr(0),
        startTime: '19:00',
        endTime: '20:00',
        estimatedDuration: 60,
        actualDuration: 0,
        status: 'TODO',
        priority: 'MEDIUM',
        categoryId: categoryMap['Exercise'],
        tags: []
      },

      // Overdue task (for overdue testing)
      {
        title: 'Submit Internship Weekly Reflection Report',
        date: getDateStr(-1),
        startTime: '17:00',
        endTime: '18:00',
        estimatedDuration: 60,
        actualDuration: 0,
        status: 'TODO',
        priority: 'URGENT',
        categoryId: categoryMap['Internship'],
        tags: ['urgent', 'review']
      },

      // Upcoming days
      {
        title: 'System Design: Distributed Rate Limiter',
        date: getDateStr(1),
        startTime: '10:00',
        endTime: '12:00',
        estimatedDuration: 120,
        actualDuration: 0,
        status: 'TODO',
        priority: 'HIGH',
        categoryId: categoryMap['Coding'],
        tags: ['deepwork']
      },
      {
        title: 'Linear Algebra Review: SVD and Eigenvalues',
        date: getDateStr(1),
        startTime: '15:00',
        endTime: '17:00',
        estimatedDuration: 120,
        actualDuration: 0,
        status: 'TODO',
        priority: 'MEDIUM',
        categoryId: categoryMap['College'],
        tags: []
      },
      {
        title: 'Mock Technical Interview Session',
        date: getDateStr(2),
        startTime: '16:00',
        endTime: '17:30',
        estimatedDuration: 90,
        actualDuration: 0,
        status: 'TODO',
        priority: 'HIGH',
        categoryId: categoryMap['DSA'],
        tags: ['leetcode']
      }
    ];

    for (const t of sampleTasks) {
      const { sessions, tags, ...taskData } = t;
      const createdTask = await prisma.task.create({
        data: taskData
      });

      if (sessions && sessions.length > 0) {
        for (const s of sessions) {
          const sessionStart = new Date(Date.now() - (s.duration + 10) * 60000);
          const sessionEnd = new Date(Date.now() - 10 * 60000);
          await prisma.workSession.create({
            data: {
              taskId: createdTask.id,
              startTime: sessionStart,
              endTime: sessionEnd,
              duration: s.duration,
              notes: s.notes
            }
          });
        }
      }

      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          if (tagMap[tagName]) {
            await prisma.taskTag.create({
              data: {
                taskId: createdTask.id,
                tagId: tagMap[tagName]
              }
            });
          }
        }
      }
    }

    // Seed a DailyReview for yesterday
    await prisma.dailyReview.upsert({
      where: { date: getDateStr(-1) },
      update: {},
      create: {
        date: getDateStr(-1),
        rating: 4,
        completedCount: 2,
        plannedHours: 3.5,
        actualHours: 3.1,
        whatWentWell: 'High concentration during morning deep work. Finished transformer paper analysis.',
        whatToImprove: 'Distracted around 3 PM by notifications. Need to turn on Focus mode.',
        tomorrowPriority: 'Knapsack DP problems and database normalization.'
      }
    });

    console.log('Sample tasks and review seeded successfully.');
  }

  console.log('Seeding completed successfully.');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
