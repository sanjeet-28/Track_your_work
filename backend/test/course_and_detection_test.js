const http = require('http');

function request(method, path, body = null) {
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

async function runTests() {
  console.log('=== Running Course & Task Type Detection Tests ===');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.body.status === 'ok', 'API Health check');

    // 2. Create task with "COL333 lec 4"
    const t1 = await request('POST', '/api/tasks', {
      title: 'COL333 lec 4',
      date: '2026-10-05',
      estimatedDuration: 60
    });
    assert(t1.status === 201, 'Create task COL333 lec 4 returns 201');
    const task1 = t1.body.data;
    assert(task1.course && task1.course.code === 'COL333', 'Course COL333 auto-detected and linked');
    assert(task1.taskType === 'Lecture', 'Task type Lecture auto-detected from "lec"');
    assert(Array.isArray(task1.tags) && task1.tags.some(t => t.name.toLowerCase() === 'lecture'), 'Lecture tag auto-added');

    // 3. Create task with "ell205 tut part 1" (lowercase course code)
    const t2 = await request('POST', '/api/tasks', {
      title: 'ell205 tut part 1',
      date: '2026-10-05',
      estimatedDuration: 45
    });
    assert(t2.status === 201, 'Create task ell205 tut part 1 returns 201');
    const task2 = t2.body.data;
    assert(task2.course && task2.course.code === 'ELL205', 'Course ELL205 normalized uppercase');
    assert(task2.taskType === 'Tutorial', 'Task type Tutorial auto-detected from "tut"');

    // 4. Create another task with "COL333 ques graphs" (same course capitalized)
    const t3 = await request('POST', '/api/tasks', {
      title: 'COL333 ques graphs',
      date: '2026-10-05',
      estimatedDuration: 90
    });
    assert(t3.status === 201, 'Create task COL333 ques graphs returns 201');
    const task3 = t3.body.data;
    assert(task3.courseId === task1.courseId, 'COL333 reuses existing course record without duplication');
    assert(task3.taskType === 'Question Practice', 'Task type Question Practice auto-detected from "ques"');

    // 5. Create task with "APL107 PYQS Chapter 3"
    const t4 = await request('POST', '/api/tasks', {
      title: 'APL107 PYQS Chapter 3',
      date: '2026-10-05',
      estimatedDuration: 60
    });
    assert(t4.status === 201, 'Create task APL107 PYQS returns 201');
    const task4 = t4.body.data;
    assert(task4.course && task4.course.code === 'APL107', 'Course APL107 auto-detected');
    assert(task4.taskType === 'Previous Year Questions', 'Task type PYQS auto-detected');

    // 6. Create task with "AIL2872 rev"
    const t5 = await request('POST', '/api/tasks', {
      title: 'AIL2872 rev',
      date: '2026-10-05',
      estimatedDuration: 50
    });
    assert(t5.status === 201, 'Create task AIL2872 rev returns 201');
    const task5 = t5.body.data;
    assert(task5.course && task5.course.code === 'AIL2872', 'Course AIL2872 auto-detected');
    assert(task5.taskType === 'Revision', 'Task type Revision auto-detected from "rev"');

    // 7. Test work session logging on t1 (COL333)
    const startRes = await request('POST', `/api/timer/tasks/${task1.id}/start`, { notes: 'Starting lecture' });
    assert(startRes.status === 200, 'Start work timer on task t1');
    const stopRes = await request('POST', `/api/timer/tasks/${task1.id}/stop`, { notes: 'Watched lecture 4' });
    assert(stopRes.status === 200, 'Stop work timer on task t1');

    // 8. Test Courses list API
    const coursesRes = await request('GET', '/api/courses');
    assert(coursesRes.status === 200, 'GET /api/courses returns 200');
    const coursesList = coursesRes.body.data.courses;
    assert(coursesList.length >= 4, `At least 4 courses returned (found ${coursesList.length})`);
    const colCourse = coursesList.find(c => c.code === 'COL333');
    assert(colCourse && colCourse.stats.totalTasks >= 2, 'COL333 has at least 2 tasks');

    // 9. Test Course Heatmap API
    const heatmapRes = await request('GET', `/api/courses/${colCourse.id}/heatmap`);
    assert(heatmapRes.status === 200, 'GET /api/courses/:id/heatmap returns 200');
    assert(Array.isArray(heatmapRes.body.data.heatmap), 'Heatmap contains array of days');

    // 10. Test Daily Course Breakdown API
    const dailyRes = await request('GET', '/api/courses/analytics/daily?date=2026-10-05');
    assert(dailyRes.status === 200, 'GET /api/courses/analytics/daily returns 200');
    assert(dailyRes.body.data.date === '2026-10-05', 'Daily breakdown returns correct date');
    assert(Array.isArray(dailyRes.body.data.courses), 'Daily breakdown contains courses array');

    // 11. Test Course Analytics Overview
    const overviewRes = await request('GET', '/api/courses/analytics/overview');
    assert(overviewRes.status === 200, 'GET /api/courses/analytics/overview returns 200');
    assert(Array.isArray(overviewRes.body.data.mostStudied), 'Overview has mostStudied array');
    assert(Array.isArray(overviewRes.body.data.neglected), 'Overview has neglected array');

    // 12. Test Course Deletion: Delete Course Only (preserve tasks)
    const tempCourse = await request('POST', '/api/courses', { code: 'TMP999', name: 'Temporary Course' });
    assert(tempCourse.status === 201, 'Created temp course TMP999');
    const tempTask = await request('POST', '/api/tasks', { title: 'TMP999 lec 1', date: '2026-10-05' });
    assert(tempTask.status === 201, 'Created task for TMP999');

    // Delete course only
    const delCourseOnly = await request('DELETE', `/api/courses/${tempCourse.body.data.id}?deleteTasks=false`);
    assert(delCourseOnly.status === 200 && delCourseOnly.body.data.tasksDeleted === false, 'Course deleted with tasks preserved');
    
    // Verify task still exists and course is null
    const checkTask = await request('GET', `/api/tasks/${tempTask.body.data.id}`);
    assert(checkTask.status === 200 && checkTask.body.data.id === tempTask.body.data.id, 'Task still exists after course deletion');
    assert(checkTask.body.data.course === null, 'Task course set to null after course deletion');

    // Clean up temp task
    await request('DELETE', `/api/tasks/${tempTask.body.data.id}`);

    // Summary
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTests();
