export default function HistoryLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-40 bg-gradient-to-br from-brand-500 to-brand-800" />
      <main className="mx-auto max-w-md px-4 pb-24 pt-6">
        <div className="mb-4 h-6 w-32 rounded bg-gray-100" />
        <div className="flex flex-col gap-2">
          <div className="h-14 rounded-xl bg-gray-100" />
          <div className="h-14 rounded-xl bg-gray-100" />
          <div className="h-14 rounded-xl bg-gray-100" />
          <div className="h-14 rounded-xl bg-gray-100" />
        </div>
      </main>
    </div>
  );
}
