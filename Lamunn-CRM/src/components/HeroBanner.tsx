import { Sparkles } from "lucide-react";

export default function HeroBanner({
  imageUrl,
  appName = "Lamunn",
  tagline,
}: {
  imageUrl?: string | null;
  appName?: string | null;
  tagline?: string | null;
}) {
  const name = appName?.trim() || "Lamunn";

  return (
    <div
      className="relative flex flex-col items-center justify-center gap-1 overflow-hidden bg-gradient-to-br from-brand-500 to-brand-800 px-6 py-10 text-center text-white"
      style={imageUrl ? { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {imageUrl && <div className="absolute inset-0 bg-black/35" />}

      <div className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-bold text-brand-700 shadow">
        {name.slice(0, 1)}
      </div>
      <Sparkles size={18} className="absolute right-6 top-6 text-white/80" />
      <Sparkles size={10} className="absolute right-12 top-14 text-white/50" />
      <h1 className="relative text-2xl font-bold tracking-wide">{name}</h1>
      {tagline && <p className="relative max-w-xs text-sm text-white/85">{tagline}</p>}
    </div>
  );
}
