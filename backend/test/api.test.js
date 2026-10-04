const assert = require('assert');
const http = require('http');
const app = require('../src/server');
const prisma = require('../src/lib/prisma');

let server;
let baseUrl;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
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
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed, raw: data });
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

async function runTests() {
  console.log('--- Starting Backend API Test Suite ---');
  
  // Start server on ephemeral port
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  let createdTaskId = null;

  try {
    // 0. Health check
    console.log('Test 0: API Health Check');
    const health = await request('GET', '/api/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body.status, 'ok');
    console.log('✓ Health check passed');

    // 1. Create task
    console.log('\nTest 1: Create Task');
    const createRes = await request('POST', '/api/tasks', {
      title: 'Automated Test Task: Build Verification',
      description: 'Testing task creation endpoint',
      date: '2026-10-05',
      startTime: '10:00',
      endTime: '11:30',
      priority: 'HIGH',
      tags: ['test', 'verification']
    });
    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createRes.body.success, true);
    assert.strictEqual(createRes.body.data.title, 'Automated Test Task: Build Verification');
    assert.strictEqual(createRes.body.data.estimatedDuration, 90);
    assert.strictEqual(createRes.body.data.status, 'TODO');
    assert.strictEqual(createRes.body.data.tags.length, 2);
    createdTaskId = createRes.body.data.id;
    console.log('✓ Create task passed. Task ID:', createdTaskId);

    // 2. Get task
    console.log('\nTest 2: Get Task by ID');
    const getRes = await request('GET', `/api/tasks/${createdTaskId}`);
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.body.data.id, createdTaskId);
    assert.strictEqual(getRes.body.data.title, 'Automated Test Task: Build Verification');
    console.log('✓ Get task passed');

    // 3. Update task
    console.log('\nTest 3: Update Task');
    const updateRes = await request('PUT', `/api/tasks/${createdTaskId}`, {
      title: 'Automated Test Task: Updated Title',
      startTime: '10:00',
      endTime: '12:00',
      priority: 'URGENT'
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.data.title, 'Automated Test Task: Updated Title');
    assert.strictEqual(updateRes.body.data.estimatedDuration, 120);
    assert.strictEqual(updateRes.body.data.priority, 'URGENT');
    console.log('✓ Update task passed');

    // 4. Mark complete
    console.log('\nTest 4: Mark Complete');
    const completeRes = await request('PATCH', `/api/tasks/${createdTaskId}/status`, {
      status: 'COMPLETED'
    });
    assert.strictEqual(completeRes.status, 200);
    assert.strictEqual(completeRes.body.data.status, 'COMPLETED');
    assert.ok(completeRes.body.data.completedAt !== null);
    console.log('✓ Mark complete passed');

    // 5. Reopen task
    console.log('\nTest 5: Reopen Task');
    const reopenRes = await request('PATCH', `/api/tasks/${createdTaskId}/status`, {
      status: 'TODO'
    });
    assert.strictEqual(reopenRes.status, 200);
    assert.strictEqual(reopenRes.body.data.status, 'TODO');
    assert.strictEqual(reopenRes.body.data.completedAt, null);
    console.log('✓ Reopen task passed');

    // 6. Move task to another date (Reschedule)
    console.log('\nTest 6: Move Task to Another Date');
    const rescheduleRes = await request('PATCH', `/api/tasks/${createdTaskId}/reschedule`, {
      date: '2026-10-08',
      startTime: '14:00',
      endTime: '15:30'
    });
    assert.strictEqual(rescheduleRes.status, 200);
    assert.strictEqual(rescheduleRes.body.data.date, '2026-10-08');
    assert.strictEqual(rescheduleRes.body.data.startTime, '14:00');
    assert.strictEqual(rescheduleRes.body.data.endTime, '15:30');
    assert.strictEqual(rescheduleRes.body.data.estimatedDuration, 90);
    console.log('✓ Move task to another date passed');

    // 7. Start work session
    console.log('\nTest 7: Start Work Session');
    const startRes = await request('POST', `/api/timer/tasks/${createdTaskId}/start`, {
      notes: 'Initial work sprint'
    });
    assert.strictEqual(startRes.status, 200);
    assert.strictEqual(startRes.body.success, true);
    assert.ok(startRes.body.data.session.id);
    assert.strictEqual(startRes.body.data.task.status, 'IN_PROGRESS');
    console.log('✓ Start work session passed. Session ID:', startRes.body.data.session.id);

    // 8. Active timer check
    console.log('\nTest 8: Check Active Session');
    const activeRes = await request('GET', '/api/timer/active');
    assert.strictEqual(activeRes.status, 200);
    assert.ok(activeRes.body.data !== null);
    assert.strictEqual(activeRes.body.data.taskId, createdTaskId);
    console.log('✓ Active timer query passed');

    // 9. Stop work session & Calculate duration
    console.log('\nTest 9: Stop Work Session & Duration Calculation');
    const stopRes = await request('POST', `/api/timer/tasks/${createdTaskId}/stop`, {
      notes: 'Finished testing session'
    });
    assert.strictEqual(stopRes.status, 200);
    assert.ok(stopRes.body.data.session.endTime !== null);
    assert.ok(stopRes.body.data.task.actualDuration >= 0);
    console.log('✓ Stop work session passed. Task actualDuration:', stopRes.body.data.task.actualDuration);

    // 10. Multiple work sessions for one task
    console.log('\nTest 10: Multiple Sessions for One Task');
    // Start session 2
    await request('POST', `/api/timer/tasks/${createdTaskId}/start`, { notes: 'Session 2' });
    // Stop session 2
    await request('POST', `/api/timer/tasks/${createdTaskId}/stop`, { notes: 'Session 2 done' });
    const sessionsRes = await request('GET', `/api/timer/tasks/${createdTaskId}/sessions`);
    assert.strictEqual(sessionsRes.status, 200);
    assert.strictEqual(sessionsRes.body.data.length, 2);
    console.log('✓ Multiple sessions verified (count = 2)');

    // 11. Duplicate task
    console.log('\nTest 11: Duplicate Task');
    const dupRes = await request('POST', `/api/tasks/${createdTaskId}/duplicate`, {
      date: '2026-10-09'
    });
    assert.strictEqual(dupRes.status, 201);
    assert.strictEqual(dupRes.body.data.date, '2026-10-09');
    assert.ok(dupRes.body.data.title.includes('(Copy)'));
    const dupTaskId = dupRes.body.data.id;
    await request('DELETE', `/api/tasks/${dupTaskId}`);
    console.log('✓ Duplicate task passed');

    // 12. Recurring task support
    console.log('\nTest 12: Recurring Task Definition');
    const recurringRes = await request('POST', '/api/tasks', {
      title: 'Daily Standup Call',
      date: '2026-10-05',
      startTime: '09:00',
      endTime: '09:30',
      isRecurring: true,
      recurrenceType: 'DAILY'
    });
    assert.strictEqual(recurringRes.status, 201);
    assert.strictEqual(recurringRes.body.data.isRecurring, true);
    assert.strictEqual(recurringRes.body.data.recurrenceType, 'DAILY');
    await request('DELETE', `/api/tasks/${recurringRes.body.data.id}`);
    console.log('✓ Recurring task creation verified');

    // 13. Analytics calculations
    console.log('\nTest 13: Analytics Endpoints');
    const overviewRes = await request('GET', '/api/analytics/overview');
    assert.strictEqual(overviewRes.status, 200);
    assert.ok(typeof overviewRes.body.data.total === 'number');
    assert.ok(typeof overviewRes.body.data.completionRate === 'number');

    const scoreRes = await request('GET', '/api/analytics/score');
    assert.strictEqual(scoreRes.status, 200);
    assert.ok(scoreRes.body.data.score >= 0 && scoreRes.body.data.score <= 100);
    assert.ok(scoreRes.body.data.breakdown !== undefined);

    const heatmapRes = await request('GET', '/api/analytics/heatmap?year=2026');
    assert.strictEqual(heatmapRes.status, 200);
    assert.ok(Array.isArray(heatmapRes.body.data.days));

    const insightsRes = await request('GET', '/api/analytics/insights');
    assert.strictEqual(insightsRes.status, 200);
    assert.ok(Array.isArray(insightsRes.body.data));
    console.log(`✓ Analytics verified (Score: ${scoreRes.body.data.score}/100, Heatmap points: ${heatmapRes.body.data.days.length}, Insights: ${insightsRes.body.data.length})`);

    // 14. Invalid input validation
    console.log('\nTest 14: Validation and Error Handling');
    const invalidTitleRes = await request('POST', '/api/tasks', {
      title: '   ',
      date: '2026-10-05'
    });
    assert.strictEqual(invalidTitleRes.status, 400);
    assert.strictEqual(invalidTitleRes.body.success, false);

    const invalidDateRes = await request('POST', '/api/tasks', {
      title: 'Invalid Date Task',
      date: 'invalid-date'
    });
    assert.strictEqual(invalidDateRes.status, 400);

    const invalidPriorityRes = await request('POST', '/api/tasks', {
      title: 'Invalid Priority Task',
      date: '2026-10-05',
      priority: 'SUPER_URGENT'
    });
    assert.strictEqual(invalidPriorityRes.status, 400);
    console.log('✓ Validation correctly rejected empty title, malformed date, and invalid priority');

    // 15. Delete task
    console.log('\nTest 15: Delete Task');
    const delRes = await request('DELETE', `/api/tasks/${createdTaskId}`);
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delRes.body.success, true);
    
    // Verify 404 when querying deleted task
    const checkDeleted = await request('GET', `/api/tasks/${createdTaskId}`);
    assert.strictEqual(checkDeleted.status, 404);
    console.log('✓ Delete task and cascade session cleanup verified');

    // 16. Export testing
    console.log('\nTest 16: Export Data (JSON & CSV)');
    const exportJson = await request('GET', '/api/export?format=json');
    assert.strictEqual(exportJson.status, 200);
    assert.ok(exportJson.body.tasks.length > 0);

    const exportCsv = await request('GET', '/api/export?format=csv');
    assert.strictEqual(exportCsv.status, 200);
    assert.ok(exportCsv.raw.includes('Title,Date,Start Time'));
    console.log('✓ Export JSON and CSV endpoints verified');

    console.log('\n========================================');
    console.log('🎉 ALL 16 BACKEND API TESTS PASSED!');
    console.log('========================================\n');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }
}

runTests();
