export default function HeroBanner() {
  return (
    <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-brand-500 to-brand-800 px-6 text-center text-white">
      <div className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-bold text-brand-700 shadow">
        L
      </div>
      <h1 className="text-2xl font-bold tracking-wide">Lamunn</h1>
    </div>
  );
}
