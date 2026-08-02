// One-off generator: rasterizes ViNha brand SVG masters into public/ assets.
// Source of truth for the vector geometry is artifacts/branding/CURRENT/assets/svg/*.svg.
// Re-run with `node scripts/generate-brand-assets.mjs` any time a master SVG changes.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const svgDir = path.join(root, "artifacts/branding/CURRENT/assets/svg");
const exportsDir = path.join(root, "artifacts/branding/CURRENT/assets/exports");
const publicDir = path.join(root, "public");

const TEAL = { r: 15, g: 118, b: 110 };

async function renderPng(svgFile, size, { flatten = false } = {}) {
  const svgPath = path.join(svgDir, svgFile);
  const svgBuffer = await readFile(svgPath);
  let img = sharp(svgBuffer, { density: 384 }).resize(size, size);
  if (flatten) {
    img = img.flatten({ background: TEAL });
  }
  return img.png().toBuffer();
}

function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + dirEntrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  const imageBuffers = [];

  for (let i = 0; i < count; i += 1) {
    const size = sizes[i];
    const png = pngBuffers[i];
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 = 256)
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8); // image data size
    entry.writeUInt32LE(offset, 12); // image data offset
    offset += png.length;
    dirEntries.push(entry);
    imageBuffers.push(png);
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

async function main() {
  await mkdir(publicDir, { recursive: true });
  await mkdir(exportsDir, { recursive: true });

  // Favicon SVG (vector, shipped as-is)
  const faviconSvg = await readFile(path.join(svgDir, "favicon.svg"), "utf8");
  await writeFile(path.join(publicDir, "favicon.svg"), faviconSvg);

  // Favicon rasters
  const fav16 = await renderPng("favicon.svg", 16);
  const fav32 = await renderPng("favicon.svg", 32);
  const fav48 = await renderPng("favicon.svg", 48);
  await writeFile(path.join(publicDir, "favicon-16x16.png"), fav16);
  await writeFile(path.join(publicDir, "favicon-32x32.png"), fav32);

  // Multi-res favicon.ico (16/32/48, embedded PNG entries)
  const ico = buildIco([fav16, fav32, fav48], [16, 32, 48]);
  await writeFile(path.join(publicDir, "favicon.ico"), ico);

  // Apple touch icon — no alpha, flattened onto brand plate
  const appleTouch = await renderPng("app-icon.svg", 180, { flatten: true });
  await writeFile(path.join(publicDir, "apple-touch-icon.png"), appleTouch);

  // PWA standard manifest icons
  const icon192 = await renderPng("app-icon.svg", 192, { flatten: true });
  const icon512 = await renderPng("app-icon.svg", 512, { flatten: true });
  await writeFile(path.join(publicDir, "icon-192.png"), icon192);
  await writeFile(path.join(publicDir, "icon-512.png"), icon512);

  // PWA maskable icon
  const maskable512 = await renderPng("maskable.svg", 512, { flatten: true });
  await writeFile(path.join(publicDir, "maskable-512.png"), maskable512);

  // App Store master (kept in artifacts, not shipped to public/)
  const master1024 = await renderPng("app-icon.svg", 1024, { flatten: true });
  await writeFile(path.join(exportsDir, "app-icon-1024.png"), master1024);

  process.stdout.write("Brand assets generated.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
