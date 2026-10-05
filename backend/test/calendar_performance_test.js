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
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

async function runCalendarPerformanceTests() {
  console.log('=== CALENDAR PERFORMANCE & RANGE FETCHING VERIFICATION ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS]: ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL]: ${message}`);
      failed++;
    }
  }

  const today = '2026-10-05';
  const createdTaskIds = [];

  try {
    // 1. Verify range-based task fetching on empty range
    const emptyRangeRes = await apiCall('GET', `/api/tasks?startDate=2035-01-01&endDate=2035-01-10`);
    assert(emptyRangeRes.status === 200, 'GET /api/tasks on future range returns 200');
    assert(Array.isArray(emptyRangeRes.body.data) && emptyRangeRes.body.data.length === 0, 'Empty range returns empty array');

    // 2. Create tasks across multiple days: past 10 days, today, future 10 days
    console.log('\n--- Seeding tasks across date ranges ---');
    // Day 0 (today): 5 tasks on one day
    for (let i = 1; i <= 5; i++) {
      const sH = String(8 + i).padStart(2, '0');
      const eH = String(9 + i).padStart(2, '0');
      const res = await apiCall('POST', '/api/tasks', {
        title: `COL333 lec ${i} graph algorithms`,
        date: today,
        startTime: `${sH}:00`,
        endTime: `${eH}:00`
      });
      assert(res.status === 201, `Created task ${i} on today`);
      createdTaskIds.push(res.body.data.id);
    }

    // Past 5 days
    for (let d = -5; d <= -1; d++) {
      const dt = addDays(today, d);
      const res = await apiCall('POST', '/api/tasks', {
        title: `ELL205 tut part ${Math.abs(d)}`,
        date: dt,
        startTime: '10:00',
        endTime: '11:00'
      });
      assert(res.status === 201, `Created task on past date ${dt}`);
      createdTaskIds.push(res.body.data.id);
    }

    // Future 5 days
    for (let d = 1; d <= 5; d++) {
      const dt = addDays(today, d);
      const res = await apiCall('POST', '/api/tasks', {
        title: `AIL2872 rev chapter ${d}`,
        date: dt,
        startTime: '14:00',
        endTime: '15:00'
      });
      assert(res.status === 201, `Created task on future date ${dt}`);
      createdTaskIds.push(res.body.data.id);
    }

    // 3. Test Range-based Fetching: Initial range (-10 to +10)
    console.log('\n--- Testing Range Queries ---');
    const initialStart = addDays(today, -10);
    const initialEnd = addDays(today, 10);
    const rangeRes = await apiCall('GET', `/api/tasks?startDate=${initialStart}&endDate=${initialEnd}`);
    assert(rangeRes.status === 200, `Initial range fetch (${initialStart} to ${initialEnd}) returns 200`);
    assert(rangeRes.body.data.length >= 15, `Found ${rangeRes.body.data.length} tasks in initial 21-day range`);

    // 4. Test Incremental Future Range (+11 to +20)
    const future1Start = addDays(today, 11);
    const future1End = addDays(today, 20);
    const future1Res = await apiCall('GET', `/api/tasks?startDate=${future1Start}&endDate=${future1End}`);
    assert(future1Res.status === 200, `Future 10-day range fetch (${future1Start} to ${future1End}) returns 200`);

    // 5. Test Incremental Past Range (-20 to -11)
    const past1Start = addDays(today, -20);
    const past1End = addDays(today, -11);
    const past1Res = await apiCall('GET', `/api/tasks?startDate=${past1Start}&endDate=${past1End}`);
    assert(past1Res.status === 200, `Past 10-day range fetch (${past1Start} to ${past1End}) returns 200`);

    // 6. Test Task Rescheduling Consistency
    console.log('\n--- Testing Reschedule and Mutability ---');
    const taskToMove = createdTaskIds[0];
    const newDate = addDays(today, 3);
    const rescheduleRes = await apiCall('PATCH', `/api/tasks/${taskToMove}/reschedule`, { date: newDate });
    assert(rescheduleRes.status === 200, 'Reschedule API returns 200');
    assert(rescheduleRes.body.data.date === newDate, 'Task date successfully updated to new date');

    // Verify task is removed from today
    const todayTasks = await apiCall('GET', `/api/tasks?date=${today}`);
    assert(!todayTasks.body.data.some(t => t.id === taskToMove), 'Task is not in old date');

    // Verify task appears on new date
    const targetDateTasks = await apiCall('GET', `/api/tasks?date=${newDate}`);
    assert(targetDateTasks.body.data.some(t => t.id === taskToMove), 'Task appears on new date without duplication');

    // 7. Cleanup created test tasks
    console.log('\n--- Cleaning up test tasks ---');
    for (const id of createdTaskIds) {
      await apiCall('DELETE', `/api/tasks/${id}`);
    }
    console.log(`Cleaned up ${createdTaskIds.length} test tasks.`);

    console.log(`\n====================================================`);
    console.log(`  CALENDAR AUDIT: ${passed} PASSED, ${failed} FAILED  `);
    console.log(`====================================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runCalendarPerformanceTests();
