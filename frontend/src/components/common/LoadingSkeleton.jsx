export function LoadingSkeleton({ count = 3, className = 'h-16' }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`w-full rounded-xl bg-slate-200/70 dark:bg-slate-800/60 animate-pulse ${className}`}
        />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60 animate-pulse p-4"
        />
      ))}
    </div>
  );
}
