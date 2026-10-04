import { getTodayDateStr, addDays } from './dateFormats';

/**
 * Natural Language Parser for Quick Add Task
 * Examples:
 * "DSA practice tomorrow 7 PM - 9 PM !high #leetcode"
 * "Team meeting today at 2:30 PM for 45 mins"
 * "ML Experiment on Friday 10:00 - 12:00 !urgent"
 */
export function parseQuickAddInput(input, categories = []) {
  if (!input || typeof input !== 'string') {
    return { title: '', date: getTodayDateStr(), startTime: '', endTime: '', priority: 'MEDIUM', categoryId: null, tags: [] };
  }

  let text = input.trim();
  let date = getTodayDateStr();
  let startTime = '';
  let endTime = '';
  let priority = 'MEDIUM';
  let categoryId = null;
  const tags = [];

  // 1. Extract Priority (!urgent, !high, !med, !low)
  const priorityMatch = text.match(/!(urgent|high|medium|med|low)\b/i);
  if (priorityMatch) {
    const pStr = priorityMatch[1].toLowerCase();
    if (pStr === 'urgent') priority = 'URGENT';
    else if (pStr === 'high') priority = 'HIGH';
    else if (pStr === 'low') priority = 'LOW';
    else priority = 'MEDIUM';
    text = text.replace(priorityMatch[0], ' ');
  }

  // 2. Extract Tags (#tag)
  const tagMatches = text.match(/#([a-zA-Z0-9_-]+)/g);
  if (tagMatches) {
    tagMatches.forEach(tagMatch => {
      const tagName = tagMatch.slice(1).toLowerCase();
      tags.push(tagName);

      // Check if tag matches an existing category
      const matchedCat = categories.find(c => c.name.toLowerCase() === tagName);
      if (matchedCat && !categoryId) {
        categoryId = matchedCat.id;
      }
    });
    text = text.replace(/#([a-zA-Z0-9_-]+)/g, ' ');
  }

  // 3. Extract Dates (today, tomorrow, next monday, friday, etc.)
  const today = getTodayDateStr();
  if (/\btomorrow\b/i.test(text)) {
    date = addDays(today, 1);
    text = text.replace(/\btomorrow\b/i, ' ');
  } else if (/\btoday\b/i.test(text)) {
    date = today;
    text = text.replace(/\btoday\b/i, ' ');
  } else if (/\byesterday\b/i.test(text)) {
    date = addDays(today, -1);
    text = text.replace(/\byesterday\b/i, ' ');
  } else {
    // Check weekday names (e.g. "on monday", "this friday", "next tuesday")
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const weekdayMatch = text.match(/\b(next\s+|this\s+|on\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
    if (weekdayMatch) {
      const targetDayName = weekdayMatch[2].toLowerCase();
      const targetDayIdx = weekdays.indexOf(targetDayName);
      const curDate = new Date();
      const curDayIdx = curDate.getDay();
      let diff = targetDayIdx - curDayIdx;
      if (diff <= 0) diff += 7; // next occurrence
      date = addDays(today, diff);
      text = text.replace(weekdayMatch[0], ' ');
    }
  }

  // 4. Extract Time Ranges (e.g. "7 PM - 9 PM", "7:00 PM to 8:30 PM", "14:00-15:30")
  const rangeMatch = text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
  if (rangeMatch) {
    startTime = normalizeTimeTo24h(rangeMatch[1]);
    endTime = normalizeTimeTo24h(rangeMatch[2]);
    text = text.replace(rangeMatch[0], ' ');
  } else {
    // Single time (e.g. "at 7 PM" or "at 14:00")
    const singleTimeMatch = text.match(/\b(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
    if (singleTimeMatch) {
      startTime = normalizeTimeTo24h(singleTimeMatch[1]);
      text = text.replace(singleTimeMatch[0], ' ');
    }
  }

  // Clean up title
  const cleanTitle = text.replace(/\s+/g, ' ').replace(/^[,\s-]+|[,\s-]+$/g, '').trim();

  return {
    title: cleanTitle || 'New Task',
    date,
    startTime,
    endTime,
    priority,
    categoryId,
    tags
  };
}

function normalizeTimeTo24h(str) {
  if (!str) return '';
  const clean = str.trim().toLowerCase();
  const isPM = clean.includes('pm');
  const isAM = clean.includes('am');
  const timeOnly = clean.replace(/[ap]m/, '').trim();
  const [hStr, mStr] = timeOnly.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr ? parseInt(mStr, 10) : 0;

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
