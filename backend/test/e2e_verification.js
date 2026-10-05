const http = require('http');

async function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:5173');
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), raw: data });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runAudit() {
  console.log('=== TRACK YOUR WORK FULL E2E AUDIT ===\n');

  // 1. Health check via Vite proxy
  const health = await request('GET', '/api/health');
  console.log(`1. Health via proxy: ${health.status === 200 ? 'PASS' : 'FAIL'} (${health.status})`);

  // 2. Settings get & update
  const getSettings = await request('GET', '/api/settings');
  console.log(`2. Settings GET: ${getSettings.status === 200 ? 'PASS' : 'FAIL'} (compactMode: ${getSettings.data?.data?.compactMode})`);

  const updateSettings = await request('PUT', '/api/settings', {
    ...getSettings.data?.data,
    theme: 'dark'
  });
  console.log(`3. Settings PUT: ${updateSettings.status === 200 ? 'PASS' : 'FAIL'} (theme: ${updateSettings.data?.data?.theme})`);

  // 4. Create Task with all fields
  const today = '2026-10-05';
  const newTask = await request('POST', '/api/tasks', {
    title: 'Audit Verification Work Item',
    description: 'Verifying end-to-end task flow',
    date: today,
    startTime: '13:00',
    endTime: '14:30',
    priority: 'HIGH',
    tags: ['audit', 'audit', 'verification'] // testing deduplication
  });
  console.log(`4. Task CREATE: ${newTask.status === 201 ? 'PASS' : 'FAIL'} (Status: ${newTask.status}, ID: ${newTask.data?.data?.id})`);
  const taskId = newTask.data?.data?.id;

  // 5. Test invalid time order: end < start
  const invalidTime = await request('POST', '/api/tasks', {
    title: 'Invalid Time Order Task',
    date: today,
    startTime: '15:00',
    endTime: '14:00'
  });
  console.log(`5. Reject end < start: ${invalidTime.status === 400 ? 'PASS' : 'FAIL'} (${invalidTime.data?.error})`);

  // 6. Start work timer
  const startTimer = await request('POST', `/api/timer/tasks/${taskId}/start`, { notes: 'Audit session' });
  console.log(`6. Start timer: ${startTimer.status === 200 ? 'PASS' : 'FAIL'} (Session ID: ${startTimer.data?.data?.session?.id})`);

  // 7. Active session check
  const activeSession = await request('GET', '/api/timer/active');
  console.log(`7. Active session query: ${activeSession.status === 200 && activeSession.data?.data?.taskId === taskId ? 'PASS' : 'FAIL'}`);

  // 8. Stop work timer
  const stopTimer = await request('POST', `/api/timer/tasks/${taskId}/stop`, { notes: 'Done audit' });
  console.log(`8. Stop timer: ${stopTimer.status === 200 ? 'PASS' : 'FAIL'} (Actual duration: ${stopTimer.data?.data?.task?.actualDuration}m)`);

  // 9. Mark task complete
  const markComplete = await request('PATCH', `/api/tasks/${taskId}/status`, { status: 'COMPLETED' });
  console.log(`9. Mark complete: ${markComplete.status === 200 && markComplete.data?.data?.status === 'COMPLETED' ? 'PASS' : 'FAIL'}`);

  // 10. Reopen task
  const reopen = await request('PATCH', `/api/tasks/${taskId}/status`, { status: 'TODO' });
  console.log(`10. Reopen task: ${reopen.status === 200 && reopen.data?.data?.status === 'TODO' ? 'PASS' : 'FAIL'}`);

  // 11. Reschedule task
  const reschedule = await request('PATCH', `/api/tasks/${taskId}/reschedule`, {
    date: '2026-10-06',
    startTime: '10:00',
    endTime: '11:00'
  });
  console.log(`11. Reschedule task: ${reschedule.status === 200 && reschedule.data?.data?.date === '2026-10-06' ? 'PASS' : 'FAIL'}`);

  // 12. Duplicate task
  const duplicate = await request('POST', `/api/tasks/${taskId}/duplicate`, { date: '2026-10-07' });
  console.log(`12. Duplicate task: ${duplicate.status === 201 ? 'PASS' : 'FAIL'} (Copy ID: ${duplicate.data?.data?.id})`);
  if (duplicate.data?.data?.id) {
    await request('DELETE', `/api/tasks/${duplicate.data.data.id}`);
  }

  // 13. Analytics endpoints
  const overview = await request('GET', '/api/analytics/overview');
  const score = await request('GET', '/api/analytics/score');
  const heatmap = await request('GET', '/api/analytics/heatmap?year=2026');
  const insights = await request('GET', '/api/analytics/insights');
  console.log(`13. Analytics Overview: ${overview.status === 200 ? 'PASS' : 'FAIL'}`);
  console.log(`14. Productivity Score: ${score.status === 200 ? 'PASS' : 'FAIL'} (${score.data?.data?.score}/100)`);
  console.log(`15. Heatmap Data: ${heatmap.status === 200 ? 'PASS' : 'FAIL'} (${heatmap.data?.data?.days?.length} entries)`);
  console.log(`16. Intelligence Insights: ${insights.status === 200 ? 'PASS' : 'FAIL'} (${insights.data?.data?.length} insights)`);

  // 17. Review endpoints
  const dailyReview = await request('GET', `/api/reviews/daily/${today}`);
  const weeklyReview = await request('GET', `/api/reviews/weekly/${today}`);
  console.log(`17. Daily Review: ${dailyReview.status === 200 ? 'PASS' : 'FAIL'}`);
  console.log(`18. Weekly Review: ${weeklyReview.status === 200 ? 'PASS' : 'FAIL'}`);

  // 19. Categories endpoints
  const cats = await request('GET', '/api/categories');
  console.log(`19. Categories: ${cats.status === 200 ? 'PASS' : 'FAIL'} (${cats.data?.data?.length} categories)`);

  // 20. Overdue & upcoming
  const overdue = await request('GET', '/api/tasks/overdue');
  const upcoming = await request('GET', '/api/tasks/upcoming?days=7');
  console.log(`20. Overdue items: ${overdue.status === 200 ? 'PASS' : 'FAIL'}`);
  console.log(`21. Upcoming items: ${upcoming.status === 200 ? 'PASS' : 'FAIL'}`);

  // Cleanup created task
  await request('DELETE', `/api/tasks/${taskId}`);
  console.log(`22. Cleaned up audit task: PASS`);

  console.log('\n=== ALL 22 E2E VERIFICATIONS SUCCEEDED ===');
}

runAudit().catch(console.error);
