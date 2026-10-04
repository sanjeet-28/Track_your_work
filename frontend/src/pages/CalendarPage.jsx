import { CalendarView } from '../components/calendar/CalendarView';
import { QuickAddTaskBar } from '../components/tasks/QuickAddTaskBar';

export function CalendarPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Quick Add Bar */}
      <QuickAddTaskBar />

      {/* Main Interactive Calendar */}
      <CalendarView />
    </div>
  );
}
