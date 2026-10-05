const http = require('http');

function apiCall(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
        }
      },
      (res) => {
        let responseBody = '';
        res.on('data', chunk => (responseBody += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(responseBody);
          } catch {
            parsed = responseBody;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runAudit() {
  console.log('====================================================');
  console.log('  STARTING FULL END-TO-END APPLICATION & API AUDIT  ');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failedCount++;
    }
  }

  try {
    // ----------------------------------------------------
    // Section 1: Core System & Health
    // ----------------------------------------------------
    console.log('--- 1. System Health & Ping ---');
    const health = await apiCall('GET', '/api/health');
    assert(health.status === 200 && health.body.status === 'ok', 'GET /api/health returns 200 ok');

    // ----------------------------------------------------
    // Section 2: Settings Route & Defaults
    // ----------------------------------------------------
    console.log('\n--- 2. Settings API Audit ---');
    const getSettings = await apiCall('GET', '/api/settings');
    assert(getSettings.status === 200, 'GET /api/settings returns 200');
    assert(getSettings.body.data && getSettings.body.data.theme !== undefined, 'Settings returned theme preference');

    const updateTheme = await apiCall('PUT', '/api/settings', { theme: 'dark' });
    assert(updateTheme.status === 200 && updateTheme.body.data.theme === 'dark', 'PUT /api/settings saves theme');

    // ----------------------------------------------------
    // Section 3: Automatic Detection & Flow
    // ----------------------------------------------------
    console.log('\n--- 3. Task Creation, Auto-Course & Auto-TaskType Detection ---');
    const testCases = [
      { input: 'COL333 lec 4', expectedCourse: 'COL333', expectedType: 'Lecture' },
      { input: 'ell205 tut part 1', expectedCourse: 'ELL205', expectedType: 'Tutorial' },
      { input: 'APL107 pyqs chapter 3', expectedCourse: 'APL107', expectedType: 'Previous Year Questions' },
      { input: 'col333 ques graphs', expectedCourse: 'COL333', expectedType: 'Question Practice' },
      { input: 'ail2872 rev', expectedCourse: 'AIL2872', expectedType: 'Revision' }
    ];

    const createdTasks = [];
    for (const tc of testCases) {
      const res = await apiCall('POST', '/api/tasks', {
        title: tc.input,
        date: '2026-10-05',
        startTime: '10:00',
        endTime: '11:00'
      });
      assert(res.status === 201, `POST /api/tasks for "${tc.input}" status 201`);
      const task = res.body.data;
      assert(task.course && task.course.code === tc.expectedCourse, `Auto-detected course: "${task.course?.code}" === "${tc.expectedCourse}"`);
      assert(task.taskType === tc.expectedType, `Auto-detected taskType: "${task.taskType}" === "${tc.expectedType}"`);
      createdTasks.push(task);
    }

    // ----------------------------------------------------
    // Section 4: Timer & Actual Duration Flow
    // ----------------------------------------------------
    console.log('\n--- 4. Timer Start/Stop & Work Session Duration Calculation ---');
    const sampleTask = createdTasks[0];
    const startTimer = await apiCall('POST', `/api/timer/tasks/${sampleTask.id}/start`, { notes: 'Active lecture notes' });
    assert(startTimer.status === 200, `POST /api/timer/tasks/${sampleTask.id}/start status 200`);

    const activeSession = await apiCall('GET', '/api/timer/active');
    assert(activeSession.status === 200 && activeSession.body.data?.taskId === sampleTask.id, 'GET /api/timer/active verifies running timer');

    const stopTimer = await apiCall('POST', `/api/timer/tasks/${sampleTask.id}/stop`, { notes: 'Done lecture 4' });
    assert(stopTimer.status === 200, `POST /api/timer/tasks/${sampleTask.id}/stop status 200`);

    const taskSessions = await apiCall('GET', `/api/timer/tasks/${sampleTask.id}/sessions`);
    assert(taskSessions.status === 200 && taskSessions.body.data.length >= 1, 'Task work session recorded in DB');

    // ----------------------------------------------------
    // Section 5: Task Status & Reschedule Flow
    // ----------------------------------------------------
    console.log('\n--- 5. Task Status & Reschedule Flow ---');
    const markComplete = await apiCall('PATCH', `/api/tasks/${sampleTask.id}/status`, { status: 'COMPLETED' });
    assert(markComplete.status === 200 && markComplete.body.data.status === 'COMPLETED', 'Mark task as COMPLETED');

    const reschedule = await apiCall('PATCH', `/api/tasks/${sampleTask.id}/reschedule`, { date: '2026-10-06' });
    assert(reschedule.status === 200 && reschedule.body.data.date === '2026-10-06', 'Reschedule task to 2026-10-06');

    // Verify task moved to new date
    const oldDateTasks = await apiCall('GET', '/api/tasks?date=2026-10-05');
    assert(!oldDateTasks.body.data.some(t => t.id === sampleTask.id), 'Task is no longer on old date 2026-10-05');

    const newDateTasks = await apiCall('GET', '/api/tasks?date=2026-10-06');
    assert(newDateTasks.body.data.some(t => t.id === sampleTask.id), 'Task is now present on new date 2026-10-06');

    // ----------------------------------------------------
    // Section 6: Course Management & Deletion Safety
    // ----------------------------------------------------
    console.log('\n--- 6. Course Management & Deletion Safety ---');
    const coursesList = await apiCall('GET', '/api/courses');
    assert(coursesList.status === 200, 'GET /api/courses returns 200');
    assert(coursesList.body.data.courses.some(c => c.code === 'COL333'), 'Course COL333 exists in courses list');

    // Test Safe Delete: Delete Course Only (must NOT delete tasks)
    const auditCourse = await apiCall('POST', '/api/courses', { code: 'AUD999', name: 'Audit Course' });
    assert(auditCourse.status === 201, 'Created test course AUD999');
    const auditTask = await apiCall('POST', '/api/tasks', { title: 'AUD999 tut 1', date: '2026-10-05' });
    assert(auditTask.status === 201, 'Created task for AUD999');

    const delSafe = await apiCall('DELETE', `/api/courses/${auditCourse.body.data.id}?deleteTasks=false`);
    assert(delSafe.status === 200 && delSafe.body.data.tasksDeleted === false, 'Course deleted safely (deleteTasks=false)');

    const preservedTask = await apiCall('GET', `/api/tasks/${auditTask.body.data.id}`);
    assert(preservedTask.status === 200 && preservedTask.body.data.id === auditTask.body.data.id, 'Task was PRESERVED after course deletion');
    assert(preservedTask.body.data.course === null, 'Task course reference was cleanly dissociated (null)');

    // Clean up audit task
    await apiCall('DELETE', `/api/tasks/${auditTask.body.data.id}`);

    // ----------------------------------------------------
    // Section 7: Analytics & Course Heatmap API
    // ----------------------------------------------------
    console.log('\n--- 7. Course Heatmaps & Daily Bar Graph Analytics ---');
    const colCourse = coursesList.body.data.courses.find(c => c.code === 'COL333');
    const colHeatmap = await apiCall('GET', `/api/courses/${colCourse.id}/heatmap`);
    assert(colHeatmap.status === 200, 'GET /api/courses/:id/heatmap returns 200');
    assert(Array.isArray(colHeatmap.body.data.heatmap) && colHeatmap.body.data.heatmap.length === 90, 'Course heatmap has 90 daily activity cells');

    const dailyBreakdown = await apiCall('GET', '/api/courses/analytics/daily?date=2026-10-05');
    assert(dailyBreakdown.status === 200, 'GET /api/courses/analytics/daily returns 200');
    assert(dailyBreakdown.body.data.date === '2026-10-05', 'Daily breakdown has correct date');

    const courseOverview = await apiCall('GET', '/api/courses/analytics/overview');
    assert(courseOverview.status === 200, 'GET /api/courses/analytics/overview returns 200');
    assert(Array.isArray(courseOverview.body.data.mostStudied), 'Overview includes mostStudied ranking');
    assert(Array.isArray(courseOverview.body.data.neglected), 'Overview includes neglected courses');

    // ----------------------------------------------------
    // Section 8: General Analytics, Insights, Reviews & Export
    // ----------------------------------------------------
    console.log('\n--- 8. General Analytics, Insights, Reviews & Export ---');
    const score = await apiCall('GET', '/api/analytics/score');
    assert(score.status === 200 && typeof score.body.data.score === 'number', 'GET /api/analytics/score returns numeric score');

    const heatmap = await apiCall('GET', '/api/analytics/heatmap?year=2026');
    assert(heatmap.status === 200, 'GET /api/analytics/heatmap returns 200');

    const daily = await apiCall('GET', '/api/analytics/daily?days=14');
    assert(daily.status === 200 && Array.isArray(daily.body.data), 'GET /api/analytics/daily returns 14-day array');

    const weekly = await apiCall('GET', '/api/analytics/weekly?weeks=4');
    assert(weekly.status === 200 && Array.isArray(weekly.body.data), 'GET /api/analytics/weekly returns weekly array');

    const insights = await apiCall('GET', '/api/analytics/insights');
    assert(insights.status === 200, 'GET /api/analytics/insights returns 200');

    const dailyReview = await apiCall('GET', '/api/reviews/daily/2026-10-05');
    assert(dailyReview.status === 200, 'GET /api/reviews/daily returns 200');

    const exportJson = await apiCall('GET', '/api/export?format=json');
    assert(exportJson.status === 200, 'GET /api/export?format=json returns 200 JSON archive');

    const exportCsv = await apiCall('GET', '/api/export?format=csv');
    assert(exportCsv.status === 200, 'GET /api/export?format=csv returns 200 CSV export');

    // ----------------------------------------------------
    // Section 9: Cleanup created test tasks
    // ----------------------------------------------------
    console.log('\n--- 9. Cleaning Up Test Data ---');
    for (const t of createdTasks) {
      await apiCall('DELETE', `/api/tasks/${t.id}`);
    }
    console.log('  Cleaned up all created test tasks.');

    // ----------------------------------------------------
    // Final Summary
    // ----------------------------------------------------
    console.log('\n====================================================');
    console.log(`  AUDIT COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED  `);
    console.log('====================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Audit encountered exception:', err);
    process.exit(1);
  }
}

runAudit();
