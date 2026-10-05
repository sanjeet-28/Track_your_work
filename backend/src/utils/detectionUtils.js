// Course and Task Type automatic detection utilities

const TASK_TYPE_MAP = [
  {
    regex: /\b(lec|lecture|lectures)\b/i,
    type: 'Lecture',
    tag: 'Lecture'
  },
  {
    regex: /\b(tut|tutorial|tutorials)\b/i,
    type: 'Tutorial',
    tag: 'Tutorial'
  },
  {
    regex: /\b(pyqs?|previous\s*year\s*questions?)\b/i,
    type: 'Previous Year Questions',
    tag: 'PYQS'
  },
  {
    regex: /\b(ques|question|questions|practice|probs|problems)\b/i,
    type: 'Question Practice',
    tag: 'Practice'
  },
  {
    regex: /\b(rev|revision|revising|review)\b/i,
    type: 'Revision',
    tag: 'Revision'
  }
];

const COURSE_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#e11d48'  // Rose
];

/**
 * Returns a stable color from the palette based on a hash of the code.
 */
function getCourseColor(code) {
  if (!code) return COURSE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COURSE_COLORS.length;
  return COURSE_COLORS[index];
}

/**
 * Detects course code from the first word of the task title.
 * Examples:
 * "COL333 lec 4" -> "COL333"
 * "col333 lec 4" -> "COL333"
 * "ELL205 Tut Part 1" -> "ELL205"
 * "APL107 PYQS Chapter 3" -> "APL107"
 * "COL333 ques graphs" -> "COL333"
 * "AIL2872 rev" -> "AIL2872"
 * "CS-101 lab" -> "CS101"
 */
function detectCourseCode(title) {
  if (!title || typeof title !== 'string') return null;
  const words = title.trim().split(/\s+/);
  if (words.length === 0) return null;
  const firstWord = words[0].trim();

  // Pattern for course code: alphanumeric with at least one letter and at least one digit,
  // or standard college codes like COL333, AIL2872, CS101, ELL205, APL107.
  // Allow optional hyphens/underscores e.g. CS-101 -> CS101.
  const cleaned = firstWord.replace(/[-_]/g, '');
  if (/^[A-Za-z]{2,8}\d{1,6}[A-Za-z]?$/i.test(cleaned)) {
    return cleaned.toUpperCase();
  }

  return null;
}

/**
 * Detects task type from title case-insensitively.
 * Types:
 * lec  = Lecture
 * tut  = Tutorial
 * pyqs = Previous Year Questions
 * ques = Question Practice
 * rev  = Revision
 */
function detectTaskType(title) {
  if (!title || typeof title !== 'string') return null;
  for (const item of TASK_TYPE_MAP) {
    if (item.regex.test(title)) {
      return item.type;
    }
  }
  return null;
}

/**
 * Gets the suggested tag for a detected task type.
 */
function getTagForTaskType(taskType) {
  if (!taskType) return null;
  const found = TASK_TYPE_MAP.find(item => item.type.toLowerCase() === taskType.toLowerCase());
  return found ? found.tag : taskType;
}

module.exports = {
  detectCourseCode,
  detectTaskType,
  getTagForTaskType,
  getCourseColor,
  TASK_TYPE_MAP
};
