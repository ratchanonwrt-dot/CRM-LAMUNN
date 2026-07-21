import { Sparkles } from "lucide-react";

export default function HeroBanner({ imageUrl }: { imageUrl?: string | null }) {
  return (
    <div
      className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-500 to-brand-800 px-6 text-center text-white"
      style={imageUrl ? { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {imageUrl && <div className="absolute inset-0 bg-black/35" />}

      <div className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-bold text-brand-700 shadow">
        L
      </div>
      <Sparkles size={16} className="absolute right-5 top-5 text-white/70" />
      <h1 className="relative text-2xl font-bold tracking-wide">Lamunn</h1>
    </div>
  );
}
