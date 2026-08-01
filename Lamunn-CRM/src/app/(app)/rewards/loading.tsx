export default function RewardsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-40 bg-gradient-to-br from-brand-500 to-brand-800" />
      <main className="mx-auto max-w-md px-4 pb-24 pt-0">
        <div className="mt-5 h-24 rounded-2xl bg-gray-100" />
        <div className="mb-3 mt-8 h-6 w-24 rounded bg-gray-100" />
        <div className="flex flex-col gap-3">
          <div className="h-20 rounded-xl bg-gray-100" />
          <div className="h-20 rounded-xl bg-gray-100" />
          <div className="h-20 rounded-xl bg-gray-100" />
        </div>
      </main>
    </div>
  );
}
