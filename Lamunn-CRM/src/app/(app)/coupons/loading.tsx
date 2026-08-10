export default function CouponsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-40 bg-gradient-to-br from-brand-500 to-brand-800" />
      <main className="mx-auto max-w-md px-4 pb-24 pt-6">
        <div className="mb-4 h-6 w-32 rounded bg-gray-100" />
        <div className="flex flex-col gap-3">
          <div className="h-24 rounded-xl bg-gray-100" />
          <div className="h-24 rounded-xl bg-gray-100" />
          <div className="h-24 rounded-xl bg-gray-100" />
        </div>
      </main>
    </div>
  );
}
