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

function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return null;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

async function runCalendarBannerTest() {
  console.log('=== CALENDAR TASK CARD & SPLIT INCOMPLETE/COMPLETED TEST ===\n');

  let passed = 0;
  let failed = 0;
  function assert(cond, msg) {
    if (cond) {
      console.log(`✅ [PASS]: ${msg}`);
      passed++;
    } else {
      console.error(`❌ [FAIL]: ${msg}`);
      failed++;
    }
  }

  const testDate = '2026-10-25';
  const createdTaskIds = [];

  try {
    // 1. Create incomplete tasks on testDate
    console.log('--- 1. Creating sample tasks for 2026-10-25 ---');
    const t1 = await apiCall('POST', '/api/tasks', {
      title: 'COL333 lec',
      date: testDate,
      startTime: '09:00',
      endTime: '10:00'
    });
    assert(t1.status === 201, 'Created COL333 lec at 09:00 - 10:00');
    createdTaskIds.push(t1.body.data.id);

    const t2 = await apiCall('POST', '/api/tasks', {
      title: 'ELL205 tut',
      date: testDate,
      startTime: '11:00',
      endTime: '12:00'
    });
    assert(t2.status === 201, 'Created ELL205 tut at 11:00 - 12:00');
    createdTaskIds.push(t2.body.data.id);

    const t3 = await apiCall('POST', '/api/tasks', {
      title: 'AIL2872 ques',
      date: testDate,
      startTime: '14:00',
      endTime: '16:00'
    });
    assert(t3.status === 201, 'Created AIL2872 ques at 14:00 - 16:00');
    createdTaskIds.push(t3.body.data.id);

    // 2. Create tasks that will be completed
    const t4 = await apiCall('POST', '/api/tasks', {
      title: 'COL333 rev',
      date: testDate,
      startTime: '08:00',
      endTime: '09:00'
    });
    assert(t4.status === 201, 'Created COL333 rev at 08:00 - 09:00');
    createdTaskIds.push(t4.body.data.id);

    const t5 = await apiCall('POST', '/api/tasks', {
      title: 'ELL205 lec',
      date: testDate,
      startTime: '17:00',
      endTime: '18:00'
    });
    assert(t5.status === 201, 'Created ELL205 lec at 17:00 - 18:00');
    createdTaskIds.push(t5.body.data.id);

    // Mark t4 and t5 as COMPLETED
    await apiCall('PATCH', `/api/tasks/${t4.body.data.id}/status`, { status: 'COMPLETED' });
    await apiCall('PATCH', `/api/tasks/${t5.body.data.id}/status`, { status: 'COMPLETED' });
    console.log('Marked COL333 rev and ELL205 lec as COMPLETED');

    // 3. Test Direct Inline Time Edit via PUT /api/tasks/:id
    console.log('\n--- 2. Testing Direct Time Edit (PUT /api/tasks/:id) ---');
    const updateTimeRes = await apiCall('PUT', `/api/tasks/${t1.body.data.id}`, {
      startTime: '09:00',
      endTime: '10:30'
    });
    assert(updateTimeRes.status === 200, 'Direct time update returned 200');
    assert(updateTimeRes.body.data.startTime === '09:00', 'Updated startTime verified as 09:00');
    assert(updateTimeRes.body.data.endTime === '10:30', 'Updated endTime verified as 10:30');

    // 4. Test Total Duration calculation (endTime - startTime)
    const calculatedDuration = calculateDuration(updateTimeRes.body.data.startTime, updateTimeRes.body.data.endTime);
    assert(calculatedDuration === '1h 30m', `Duration calculation: 09:00 to 10:30 = "1h 30m" (got: "${calculatedDuration}")`);

    const dur2 = calculateDuration('14:00', '16:00');
    assert(dur2 === '2h', `Duration calculation: 14:00 to 16:00 = "2h" (got: "${dur2}")`);

    // 5. Test Fetch and Partition by Date
    console.log('\n--- 3. Testing Fetch & Partition: Incomplete vs Completed ---');
    const getRes = await apiCall('GET', `/api/tasks?startDate=${testDate}&endDate=${testDate}`);
    assert(getRes.status === 200, 'GET /api/tasks for testDate returned 200');

    const tasks = getRes.body.data;
    const incomplete = tasks.filter(t => t.status !== 'COMPLETED');
    const completed = tasks.filter(t => t.status === 'COMPLETED');

    assert(incomplete.length === 3, `Incomplete tasks count: 3 (got ${incomplete.length})`);
    assert(completed.length === 2, `Completed tasks count: 2 (got ${completed.length})`);

    // Verify sort by startTime ascending
    const incompleteTimes = incomplete.map(t => t.startTime);
    assert(incompleteTimes[0] === '09:00' && incompleteTimes[1] === '11:00' && incompleteTimes[2] === '14:00',
      `Incomplete tasks sorted ascending: [09:00, 11:00, 14:00] (got: [${incompleteTimes.join(', ')}])`);

    const completedTimes = completed.map(t => t.startTime);
    assert(completedTimes[0] === '08:00' && completedTimes[1] === '17:00',
      `Completed tasks sorted ascending: [08:00, 17:00] (got: [${completedTimes.join(', ')}])`);

    // 6. Cleanup
    console.log('\n--- 4. Cleaning Up Test Data ---');
    for (const id of createdTaskIds) {
      await apiCall('DELETE', `/api/tasks/${id}`);
    }
    console.log(`Cleaned up ${createdTaskIds.length} test tasks.`);

    console.log('\n====================================================');
    console.log(`  CALENDAR BANNER AUDIT: ${passed} PASSED, ${failed} FAILED  `);
    console.log('====================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runCalendarBannerTest();
