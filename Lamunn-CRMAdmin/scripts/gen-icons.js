const sharp = require("sharp");
const path = require("path");

const OUT = (name) => path.join(__dirname, "..", "public", name);
const BRAND_GREEN = "#74936e";

function svgIcon(size) {
  const fontSize = Math.round(size * 0.34);
  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${BRAND_GREEN}"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
        font-family="Arial, Helvetica, sans-serif" font-weight="700"
        font-size="${fontSize}" letter-spacing="${Math.round(size * 0.01)}" fill="#ffffff">CRM</text>
    </svg>
  `);
}

async function main() {
  await sharp(svgIcon(192)).png().toFile(OUT("icon-192.png"));
  await sharp(svgIcon(512)).png().toFile(OUT("icon-512.png"));
  await sharp(svgIcon(180)).png().toFile(OUT("apple-touch-icon.png"));

  // Maskable: text shrunk further so it survives Android's adaptive-icon crop.
  const inner = await sharp(svgIcon(340)).resize(340, 340).png().toBuffer();
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
