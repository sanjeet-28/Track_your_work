import { useState } from 'react';
import { CalendarHeader } from './CalendarHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { AgendaView } from './AgendaView';
import { useTasks } from '../../context/TaskContext';

export function CalendarView() {
  const { rescheduleTask } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week'); // default view is week as per preferences

  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === 'month') d.setMonth(d.getMonth() - 1);
      else if (view === 'week') d.setDate(d.getDate() - 7);
      else if (view === 'day') d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === 'month') d.setMonth(d.getMonth() + 1);
      else if (view === 'week') d.setDate(d.getDate() + 7);
      else if (view === 'day') d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDropTask = (taskId, targetDate, targetStartTime = null) => {
    rescheduleTask(taskId, {
      date: targetDate,
      startTime: targetStartTime
    });
  };

  let title = '';
  if (view === 'month') {
    title = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } else if (view === 'week') {
    const s = new Date(currentDate);
    const day = s.getDay();
    const diff = (day < 1 ? 7 : 0) + day - 1;
    s.setDate(s.getDate() - diff);
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    title = `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else if (view === 'day') {
    title = currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } else {
    title = 'Scheduled Agenda';
  }

  return (
    <div className="space-y-4">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        setView={setView}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        title={title}
      />

      {view === 'month' && (
        <MonthView currentDate={currentDate} onDropTask={handleDropTask} />
      )}
      {view === 'week' && (
        <WeekView currentDate={currentDate} onDropTask={handleDropTask} />
      )}
      {view === 'day' && (
        <DayView currentDate={currentDate} />
      )}
      {view === 'agenda' && (
        <AgendaView />
      )}
    </div>
  );
}
