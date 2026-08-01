const sharp = require("sharp");
const path = require("path");

const SRC = path.join(__dirname, "..", "public", "logo-mark-white.png");
const OUT = (name) => path.join(__dirname, "..", "public", name);
const BRAND_GREEN = "#74936e";

async function main() {
  await sharp(SRC).resize(192, 192).png().toFile(OUT("icon-192.png"));
  await sharp(SRC).resize(512, 512).png().toFile(OUT("icon-512.png"));
  await sharp(SRC).resize(180, 180).png().toFile(OUT("apple-touch-icon.png"));

  // Maskable icon: logo shrunk to ~65% and centered on a solid brand-color canvas,
  // so Android's adaptive-icon crop (circle/squircle/etc.) never clips the mark.
  const inner = await sharp(SRC).resize(333, 333).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: BRAND_GREEN } })
    .composite([{ input: inner, gravity: "center" }])
    .png()
    .toFile(OUT("icon-maskable-512.png"));

  console.log("Generated icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
