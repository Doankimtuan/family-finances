// Generate platform assets from the approved Family Finance logo board.
// The source image is kept unchanged; crops only remove surrounding board space.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourcePath = path.join(root, "public/brand/logo-primary.png");
const brandDir = path.join(root, "public/brand");
const publicDir = path.join(root, "public");

const CROP = {
  lockup: { left: 280, top: 60, width: 700, height: 600 },
  mark: { left: 400, top: 75, width: 450, height: 400 },
  appIcon: { left: 70, top: 705, width: 230, height: 230 },
};

const WHITE_THRESHOLD = 248;

function isBackgroundPixel(data, index) {
  return (
    data[index] >= WHITE_THRESHOLD &&
    data[index + 1] >= WHITE_THRESHOLD &&
    data[index + 2] >= WHITE_THRESHOLD
  );
}

async function removeBorderBackground(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const queue = [];
  const visited = new Uint8Array(info.width * info.height);

  for (let y = 0; y < info.height; y += 1) {
    for (const x of [0, info.width - 1]) queue.push([x, y]);
  }
  for (let x = 1; x < info.width - 1; x += 1) {
    queue.push([x, 0], [x, info.height - 1]);
  }

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    const pixelIndex = y * info.width + x;
    const dataIndex = pixelIndex * info.channels;
    if (visited[pixelIndex] || !isBackgroundPixel(data, dataIndex)) continue;
    visited[pixelIndex] = 1;
    data[dataIndex + 3] = 0;
    if (x > 0) queue.push([x - 1, y]);
    if (x < info.width - 1) queue.push([x + 1, y]);
    if (y > 0) queue.push([x, y - 1]);
    if (y < info.height - 1) queue.push([x, y + 1]);
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();
}

async function cropApprovedAsset(kind, transparent = false) {
  const crop = sharp(sourcePath).extract(CROP[kind]).png();
  const buffer = await crop.toBuffer();
  return transparent ? removeBorderBackground(buffer) : buffer;
}

async function resizePng(buffer, size) {
  return sharp(buffer).resize(size, size).png().toBuffer();
}

function buildIco(pngBuffers, sizes) {
  const headerSize = 6;
  const directoryEntrySize = 16;
  let offset = headerSize + directoryEntrySize * pngBuffers.length;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngBuffers.length, 4);

  const entries = [];
  for (const [index, png] of pngBuffers.entries()) {
    const size = sizes[index];
    const entry = Buffer.alloc(directoryEntrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

async function main() {
  await mkdir(brandDir, { recursive: true });

  const [lockup, mark, appIcon] = await Promise.all([
    cropApprovedAsset("lockup"),
    cropApprovedAsset("mark", true),
    cropApprovedAsset("appIcon"),
  ]);
  await Promise.all([
    writeFile(path.join(brandDir, "logo-lockup.png"), lockup),
    writeFile(path.join(brandDir, "logo-mark-transparent.png"), mark),
    writeFile(
      path.join(brandDir, "app-icon.png"),
      await resizePng(appIcon, 512),
    ),
  ]);

  const faviconPngs = await Promise.all(
    [16, 32, 48].map((size) => resizePng(appIcon, size)),
  );
  await Promise.all([
    writeFile(path.join(publicDir, "favicon-16x16.png"), faviconPngs[0]),
    writeFile(path.join(publicDir, "favicon-32x32.png"), faviconPngs[1]),
    writeFile(path.join(publicDir, "favicon-48x48.png"), faviconPngs[2]),
    writeFile(
      path.join(publicDir, "favicon.ico"),
      buildIco(faviconPngs, [16, 32, 48]),
    ),
    writeFile(
      path.join(publicDir, "apple-touch-icon.png"),
      await resizePng(appIcon, 180),
    ),
    writeFile(
      path.join(publicDir, "icon-192.png"),
      await resizePng(appIcon, 192),
    ),
    writeFile(
      path.join(publicDir, "icon-512.png"),
      await resizePng(appIcon, 512),
    ),
    writeFile(
      path.join(publicDir, "maskable-512.png"),
      await resizePng(appIcon, 512),
    ),
  ]);

  process.stdout.write("Family Finance brand assets generated.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
