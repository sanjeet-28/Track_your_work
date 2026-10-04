import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../common/Toast';
import { TaskFormModal } from '../tasks/TaskFormModal';
import { TaskDetailModal } from '../tasks/TaskDetailModal';
import { RescheduleModal } from '../tasks/RescheduleModal';
import { Modal } from '../common/Modal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { showShortcutsHelp, setShowShortcutsHelp } = useKeyboardShortcuts();

  const shortcuts = [
    { key: 'N', desc: 'Create new task' },
    { key: 'T', desc: 'Go to Today view' },
    { key: 'C', desc: 'Go to Calendar view' },
    { key: 'D', desc: 'Go to Dashboard' },
    { key: 'A', desc: 'Go to Analytics' },
    { key: '/', desc: 'Focus global search input' },
    { key: 'Esc', desc: 'Close open dialog or modal' },
    { key: '?', desc: 'Show this keyboard shortcuts guide' }
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop / Tablet Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar onOpenShortcuts={() => setShowShortcutsHelp(true)} />

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

      {/* Shortcuts Help Modal */}
      <Modal
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        title="Keyboard Shortcuts"
        subtitle="Speed up your daily workflow with rapid keystrokes"
        maxWidth="max-w-md"
      >
        <div className="space-y-2.5">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
            >
              <span className="text-slate-600 dark:text-slate-300">{s.desc}</span>
              <kbd className="px-2 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold text-slate-800 dark:text-slate-100 shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
