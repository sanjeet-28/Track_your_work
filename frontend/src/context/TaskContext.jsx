import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { taskApi, categoryApi, tagApi } from '../services/api';
import { getTodayDateStr } from '../utils/dateFormats';

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    categoryId: '',
    priority: '',
    status: '',
    tag: '',
    search: ''
  });

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Modals state
  const [taskModalState, setTaskModalState] = useState({ isOpen: false, task: null, defaultDate: null, defaultTime: null });
  const [detailModalState, setDetailModalState] = useState({ isOpen: false, task: null });
  const [rescheduleModalState, setRescheduleModalState] = useState({ isOpen: false, task: null });

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch initial categories and tags
  const loadCategoriesAndTags = useCallback(async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        categoryApi.getCategories(),
        tagApi.getTags()
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (tagRes.data) setTags(tagRes.data);
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  }, []);

  useEffect(() => {
    loadCategoriesAndTags();
  }, [loadCategoriesAndTags]);

  // Fetch tasks
  const fetchTasks = useCallback(async (customParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...filters,
        ...customParams
      };
      // Clean empty params
      Object.keys(params).forEach(k => {
        if (!params[k]) delete params[k];
      });

      const res = await taskApi.getTasks(params);
      if (res.data) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Create Task
  const createTask = async (taskData) => {
    try {
      const res = await taskApi.createTask(taskData);
      if (res.data) {
        setTasks(prev => [res.data, ...prev]);
        showToast('Task created successfully');
        loadCategoriesAndTags(); // update counts
        return res.data;
      }
    } catch (err) {
      showToast(err.message || 'Failed to create task', 'error');
      throw err;
    }
  };

  // Update Task
  const updateTask = async (id, taskData) => {
    // Optimistic update
    const previous = [...tasks];
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...taskData } : t)));

    try {
      const res = await taskApi.updateTask(id, taskData);
      if (res.data) {
        setTasks(prev => prev.map(t => (t.id === id ? res.data : t)));
        if (detailModalState.task?.id === id) {
          setDetailModalState(prev => ({ ...prev, task: res.data }));
        }
        showToast('Task updated successfully');
        return res.data;
      }
    } catch (err) {
      setTasks(previous); // Rollback
      showToast(err.message || 'Failed to update task', 'error');
      throw err;
    }
  };

  // Delete Task
  const deleteTask = async (id) => {
    const previous = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id));
    if (detailModalState.task?.id === id) {
      setDetailModalState({ isOpen: false, task: null });
    }

    try {
      await taskApi.deleteTask(id);
      showToast('Task deleted');
      loadCategoriesAndTags();
    } catch (err) {
      setTasks(previous);
      showToast(err.message || 'Failed to delete task', 'error');
      throw err;
    }
  };

  // Update Status (Optimistic)
  const updateStatus = async (id, newStatus) => {
    const previous = [...tasks];
    const completedAt = newStatus === 'COMPLETED' ? new Date().toISOString() : null;

    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, status: newStatus, completedAt } : t))
    );

    if (detailModalState.task?.id === id) {
      setDetailModalState(prev => ({
        ...prev,
        task: { ...prev.task, status: newStatus, completedAt }
      }));
    }

    try {
      const res = await taskApi.updateStatus(id, newStatus);
      if (res.data) {
        setTasks(prev => prev.map(t => (t.id === id ? res.data : t)));
        if (detailModalState.task?.id === id) {
          setDetailModalState(prev => ({ ...prev, task: res.data }));
        }
      }
    } catch (err) {
      setTasks(previous);
      showToast(err.message || 'Failed to update task status', 'error');
    }
  };

  // Reschedule
  const rescheduleTask = async (id, { date, startTime, endTime }) => {
    const previous = [...tasks];
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, date, startTime: startTime || t.startTime, endTime: endTime || t.endTime } : t))
    );

    try {
      const res = await taskApi.reschedule(id, { date, startTime, endTime });
      if (res.data) {
        setTasks(prev => prev.map(t => (t.id === id ? res.data : t)));
        if (detailModalState.task?.id === id) {
          setDetailModalState(prev => ({ ...prev, task: res.data }));
        }
        showToast(`Moved to ${date}`);
      }
    } catch (err) {
      setTasks(previous);
      showToast(err.message || 'Failed to reschedule task', 'error');
    }
  };

  // Duplicate
  const duplicateTask = async (id, date) => {
    try {
      const res = await taskApi.duplicate(id, date);
      if (res.data) {
        setTasks(prev => [res.data, ...prev]);
        showToast('Task duplicated');
        return res.data;
      }
    } catch (err) {
      showToast(err.message || 'Failed to duplicate task', 'error');
    }
  };

  // Modal triggers
  const openTaskModal = (task = null, defaults = {}) => {
    setTaskModalState({
      isOpen: true,
      task,
      defaultDate: defaults.date || selectedDate,
      defaultTime: defaults.startTime || null
    });
  };

  const closeTaskModal = () => {
    setTaskModalState({ isOpen: false, task: null, defaultDate: null, defaultTime: null });
  };

  const openDetailModal = (task) => {
    setDetailModalState({ isOpen: true, task });
  };

  const closeDetailModal = () => {
    setDetailModalState({ isOpen: false, task: null });
  };

  const openRescheduleModal = (task) => {
    setRescheduleModalState({ isOpen: true, task });
  };

  const closeRescheduleModal = () => {
    setRescheduleModalState({ isOpen: false, task: null });
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        categories,
        tags,
        selectedDate,
        setSelectedDate,
        filters,
        setFilters,
        loading,
        error,
        toasts,
        showToast,
        removeToast,
        fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        updateStatus,
        rescheduleTask,
        duplicateTask,
        refreshCategories: loadCategoriesAndTags,
        // Modal helpers
        taskModalState,
        openTaskModal,
        closeTaskModal,
        detailModalState,
        openDetailModal,
        closeDetailModal,
        rescheduleModalState,
        openRescheduleModal,
        closeRescheduleModal
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  return useContext(TaskContext);
}
