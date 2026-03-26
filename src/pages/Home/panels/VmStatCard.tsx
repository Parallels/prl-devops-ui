export function VmStatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const dot: Record<string, string> = {
    emerald: 'bg-emerald-500',
    neutral: 'bg-neutral-400',
    amber: 'bg-amber-400',
    blue: 'bg-blue-500',
  };
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dot[color] ?? 'bg-neutral-400'}`} />
        <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
      </div>
      {value != null && value > 0 && <span className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{value}</span>}
    </div>
  );
}
