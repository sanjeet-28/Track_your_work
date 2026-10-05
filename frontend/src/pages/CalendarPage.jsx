import { CalendarView } from '../components/calendar/CalendarView';
import { QuickAddTaskBar } from '../components/tasks/QuickAddTaskBar';

export function CalendarPage() {
  return (
    <div className="p-3 md:p-6 max-w-3xl mx-auto space-y-4 animate-in fade-in duration-200">
      {/* Quick Add Bar */}
      <QuickAddTaskBar />

      {/* Main Interactive Calendar */}
      <CalendarView />
    </div>
  );
}
