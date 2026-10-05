import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const taskApi = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTaskById: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  reschedule: (id, payload) => api.patch(`/tasks/${id}/reschedule`, payload),
  duplicate: (id, date) => api.post(`/tasks/${id}/duplicate`, { date }),
  getOverdue: () => api.get('/tasks/overdue'),
  getUpcoming: (days = 7) => api.get('/tasks/upcoming', { params: { days } })
};

export const timerApi = {
  getActive: () => api.get('/timer/active'),
  startTimer: (taskId, notes) => api.post(`/timer/tasks/${taskId}/start`, { notes }),
  stopTimer: (taskId, notes) => api.post(`/timer/tasks/${taskId}/stop`, { notes }),
  getSessions: (taskId) => api.get(`/timer/tasks/${taskId}/sessions`),
  deleteSession: (sessionId) => api.delete(`/timer/sessions/${sessionId}`)
};

export const analyticsApi = {
  getOverview: (date) => api.get('/analytics/overview', { params: { date } }),
  getDaily: (days = 14) => api.get('/analytics/daily', { params: { days } }),
  getWeekly: (weeks = 8) => api.get('/analytics/weekly', { params: { weeks } }),
  getMonthly: (months = 6) => api.get('/analytics/monthly', { params: { months } }),
  getCategories: (params) => api.get('/analytics/categories', { params }),
  getHeatmap: (year) => api.get('/analytics/heatmap', { params: { year } }),
  getScore: () => api.get('/analytics/score'),
  getInsights: () => api.get('/analytics/insights')
};

export const categoryApi = {
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`)
};

export const tagApi = {
  getTags: () => api.get('/tags'),
  createTag: (data) => api.post('/tags', data),
  deleteTag: (id) => api.delete(`/tags/${id}`)
};

export const reviewApi = {
  getDailyReview: (date) => api.get(`/reviews/daily/${date || ''}`),
  saveDailyReview: (data) => api.post('/reviews/daily', data),
  getWeeklyReview: (startDate) => api.get(`/reviews/weekly/${startDate || ''}`)
};

export const courseApi = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id, deleteTasks = false) => api.delete(`/courses/${id}`, { params: { deleteTasks } }),
  getHeatmap: (id, days = 90) => api.get(`/courses/${id}/heatmap`, { params: { days } }),
  getDailyBreakdown: (date) => api.get('/courses/analytics/daily', { params: { date } }),
  getOverview: () => api.get('/courses/analytics/overview')
};

export const settingsApi = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data)
};

export default api;
