/**
 * Date and time utilities for Work Tracker
 * Handles local date strings ("YYYY-MM-DD") to prevent UTC timezone shifts.
 */

function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidDateStr(str) {
  if (typeof str !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(str)) return false;
  const [year, month, day] = str.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

function isValidTimeStr(str) {
  if (!str) return true; // Optional
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(str);
}

function calculateDurationMinutes(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  return endTotal >= startTotal ? endTotal - startTotal : (24 * 60 - startTotal) + endTotal;
}

function formatMinutesToReadable(minutes) {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function addDays(dateStr, days) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function getWeekBoundaries(dateStr = getTodayDateStr(), weekStartsOn = 1) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday
  
  // Calculate difference to start of week
  const diff = (dayOfWeek < weekStartsOn ? 7 : 0) + dayOfWeek - weekStartsOn;
  d.setDate(d.getDate() - diff);
  
  const startYear = d.getFullYear();
  const startMonth = String(d.getMonth() + 1).padStart(2, '0');
  const startDay = String(d.getDate()).padStart(2, '0');
  const startDate = `${startYear}-${startMonth}-${startDay}`;
  
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  const endYear = end.getFullYear();
  const endMonth = String(end.getMonth() + 1).padStart(2, '0');
  const endDay = String(end.getDate()).padStart(2, '0');
  const endDate = `${endYear}-${endMonth}-${endDay}`;

  return { startDate, endDate };
}

function getMonthBoundaries(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

module.exports = {
  getTodayDateStr,
  isValidDateStr,
  isValidTimeStr,
  calculateDurationMinutes,
  formatMinutesToReadable,
  addDays,
  getWeekBoundaries,
  getMonthBoundaries
};
