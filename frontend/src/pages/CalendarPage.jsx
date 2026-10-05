import { CalendarView } from '../components/calendar/CalendarView';

export function CalendarPage() {
  return (
    <div className="p-4 md:p-8 max-w-5xl lg:max-w-6xl w-full mx-auto space-y-4 animate-in fade-in duration-200">
      <CalendarView />
    </div>
  );
}
