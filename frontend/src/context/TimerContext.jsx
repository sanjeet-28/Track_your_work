import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { timerApi } from '../services/api';
import { useTasks } from './TaskContext';

const TimerContext = createContext();

export function TimerProvider({ children, onTimerStopped }) {
  const { fetchTasks } = useTasks();
  const [activeSession, setActiveSession] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  // Fetch active session on mount
  useEffect(() => {
    let isMounted = true;
    async function checkActive() {
      try {
        const res = await timerApi.getActive();
        if (isMounted && res.data) {
          setActiveSession(res.data);
          const startMs = new Date(res.data.startTime).getTime();
          const nowMs = Date.now();
          setElapsedSeconds(Math.max(0, Math.floor((nowMs - startMs) / 1000)));
        }
      } catch (err) {
        console.error('Failed to fetch active timer session:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    checkActive();
    return () => { isMounted = false; };
  }, []);

  // Tick elapsed seconds every second if activeSession is running
  useEffect(() => {
    if (activeSession) {
      const startTimeMs = new Date(activeSession.startTime).getTime();
      
      // Update immediately
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTimeMs) / 1000)));

      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTimeMs) / 1000)));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession]);

  async function startTimer(taskId, notes = '') {
    try {
      const res = await timerApi.startTimer(taskId, notes);
      if (res.data?.session) {
        setActiveSession({
          ...res.data.session,
          task: res.data.task
        });
        if (fetchTasks) fetchTasks();
      }
      return res.data;
    } catch (err) {
      console.error('Failed to start timer:', err);
      throw err;
    }
  }

  async function stopTimer(taskId, notes = '') {
    const targetTaskId = taskId || activeSession?.taskId;
    if (!targetTaskId) return null;

    try {
      const res = await timerApi.stopTimer(targetTaskId, notes);
      setActiveSession(null);
      setElapsedSeconds(0);
      if (fetchTasks) fetchTasks();
      if (onTimerStopped) {
        onTimerStopped(res.data);
      }
      return res.data;
    } catch (err) {
      console.error('Failed to stop timer:', err);
      throw err;
    }
  }

  function isActive(taskId) {
    return activeSession?.taskId === taskId;
  }

  return (
    <TimerContext.Provider
      value={{
        activeSession,
        activeTask: activeSession?.task || null,
        elapsedSeconds,
        loading,
        startTimer,
        stopTimer,
        isActive
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  return useContext(TimerContext);
}
