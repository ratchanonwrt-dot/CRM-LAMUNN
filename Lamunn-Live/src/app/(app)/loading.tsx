export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-6 w-48 rounded bg-stone-200" />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl border border-line bg-white shadow-card p-4">
            <div className="h-3 w-2/3 rounded bg-stone-200" />
            <div className="mt-3 h-5 w-1/2 rounded bg-stone-200" />
          </div>
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-line bg-white shadow-card" />
    </div>
  );
}
