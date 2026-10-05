import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { TaskProvider } from './context/TaskContext';
import { TimerProvider } from './context/TimerContext';
import { AppLayout } from './components/layout/AppLayout';

import { DashboardPage } from './pages/DashboardPage';
import { TodayPage } from './pages/TodayPage';
import { CalendarPage } from './pages/CalendarPage';
import { TasksPage } from './pages/TasksPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { InsightsPage } from './pages/InsightsPage';
import { ReviewPage } from './pages/ReviewPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CoursesPage } from './pages/CoursesPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <ThemeProvider>
      <TaskProvider>
        <TimerProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="today" element={<TodayPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="courses" element={<CoursesPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="insights" element={<InsightsPage />} />
                <Route path="reviews" element={<ReviewPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TimerProvider>
      </TaskProvider>
    </ThemeProvider>
  );
}

export default App;
