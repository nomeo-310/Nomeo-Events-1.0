// analytics-section-header.tsx
export function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3 mt-8">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}