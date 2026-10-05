import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../common/Toast';
import { TaskFormModal } from '../tasks/TaskFormModal';
import { TaskDetailModal } from '../tasks/TaskDetailModal';
import { RescheduleModal } from '../tasks/RescheduleModal';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop / Tablet Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto pb-16 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Global Modals */}
      <TaskFormModal />
      <TaskDetailModal />
      <RescheduleModal />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
