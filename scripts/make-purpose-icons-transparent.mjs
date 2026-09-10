import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const dir = path.resolve('src/assets/purposes');
const DARK = 40;

async function knockOutBlack(file) {
  const input = path.join(dir, file);
  const source = fs.readFileSync(input);
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const n = width * height;
  const lum = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const o = i * 4;
    lum[i] = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
  }

  const bg = new Uint8Array(n);
  const qx = new Int32Array(n);
  const qy = new Int32Array(n);
  let qs = 0;
  let qe = 0;

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (bg[i] || lum[i] > DARK) return;
    bg[i] = 1;
    qx[qe] = x;
    qy[qe] = y;
    qe += 1;
  };

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (qs < qe) {
    const x = qx[qs];
    const y = qy[qs];
    qs += 1;
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  // Soften only pixels that sit on the fill boundary.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const o = i * 4;
      if (bg[i]) {
        data[o] = 0;
        data[o + 1] = 0;
        data[o + 2] = 0;
        data[o + 3] = 0;
        continue;
      }

      let edge = false;
      if (x > 0 && bg[i - 1]) edge = true;
      else if (x + 1 < width && bg[i + 1]) edge = true;
      else if (y > 0 && bg[i - width]) edge = true;
      else if (y + 1 < height && bg[i + width]) edge = true;

      data[o + 3] = edge ? Math.max(90, Math.min(255, Math.round(lum[i] * 1.15))) : 255;
    }
  }

  const tmp = `${input}.tmp.png`;
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(tmp);
  fs.rmSync(input, { force: true });
  fs.renameSync(tmp, input);

  const transparent = bg.reduce((s, v) => s + v, 0);
  console.log(`${file}: ${width}x${height} transparent=${transparent} kept=${n - transparent}`);
}

const files = fs.readdirSync(dir).filter((f) => f.startsWith('purpose-') && f.endsWith('.png'));
for (const file of files) {
  await knockOutBlack(file);
}
