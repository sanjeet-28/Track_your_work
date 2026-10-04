export function PriorityBadge({ priority, size = 'sm' }) {
  const p = (priority || 'MEDIUM').toUpperCase();

  const styles = {
    URGENT: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    HIGH: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    MEDIUM: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    LOW: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1'
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${styles[p] || styles.MEDIUM} ${sizes[size]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 fill-current bg-current"></span>
      {p}
    </span>
  );
}

export function StatusBadge({ status, size = 'sm' }) {
  const s = (status || 'TODO').toUpperCase();

  const styles = {
    COMPLETED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    IN_PROGRESS: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    TODO: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
  };

  const labels = {
    COMPLETED: 'Completed',
    IN_PROGRESS: 'In Progress',
    TODO: 'To Do',
    CANCELLED: 'Cancelled'
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1'
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${styles[s] || styles.TODO} ${sizes[size]}`}
    >
      {labels[s] || s}
    </span>
  );
}

export function CategoryBadge({ category, size = 'sm' }) {
  if (!category) return null;

  return (
    <span
      className="inline-flex items-center text-xs px-2 py-0.5 rounded-md font-medium"
      style={{
        backgroundColor: `${category.color}15`,
        color: category.color,
        border: `1px solid ${category.color}30`
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </span>
  );
}
