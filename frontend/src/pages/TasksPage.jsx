import { useState, useMemo } from 'react';
import { Plus, CheckSquare } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { FilterBar } from '../components/tasks/FilterBar';
import { QuickAddTaskBar } from '../components/tasks/QuickAddTaskBar';
import { TaskCard } from '../components/tasks/TaskCard';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';

export function TasksPage() {
  const { tasks, openTaskModal } = useTasks();
  const [sortBy, setSortBy] = useState('startTime');
  const [sortOrder, setSortOrder] = useState('asc');

  // Sorted tasks
  const sortedTasks = useMemo(() => {
    const list = [...tasks];
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'priority') {
        const pOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        comparison = (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      } else if (sortBy === 'duration') {
        comparison = (a.estimatedDuration || 0) - (b.estimatedDuration || 0);
      } else if (sortBy === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else {
        comparison = (a.startTime || '99:99').localeCompare(b.startTime || '99:99');
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [tasks, sortBy, sortOrder]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Task Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Filter, organize, and sort all your scheduled work
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => openTaskModal()}
        >
          New Task
        </Button>
      </div>

      {/* Quick Add Bar */}
      <QuickAddTaskBar />

      {/* Filter and Sort Bar */}
      <FilterBar
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {/* Tasks List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Showing {sortedTasks.length} {sortedTasks.length === 1 ? 'task' : 'tasks'}</span>
        </div>

        {sortedTasks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <EmptyState
              icon={CheckSquare}
              title="No tasks match your filters"
              description="Try adjusting your search criteria or create a new task."
              actionLabel="+ Create Task"
              onAction={() => openTaskModal()}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
