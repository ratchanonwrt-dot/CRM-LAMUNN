import type { MetadataRoute } from "next";

// Next.js auto-serves this at /manifest.webmanifest and links it in <head> —
// makes "Add to Home Screen" launch standalone (no browser chrome) with a real icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lamunn CRM สะสมแต้ม",
    short_name: "Lamunn",
    description: "ระบบสะสมแต้มลูกค้า Lamunn",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#74936e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
