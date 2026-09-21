// Unit tests for the image pipeline. The worker lives as a template string inside index.html
// (single-file app), so the tests cut it out and evaluate it in a vm context.
// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('const workerSrc = `') + 'const workerSrc = `'.length;
const end = html.indexOf('`;\nconst workerURL');
const src = html.slice(start, end);

test('worker source can be extracted verbatim', () => {
  assert.ok(start > 100 && end > start);
  // Escapes or interpolation would make the raw text differ from what the browser runs.
  assert.ok(!src.includes('\\'), 'backslash in worker source');
  assert.ok(!src.includes('${'), 'interpolation in worker source');
});

function load() {
  const messages = [];
  const ctx = vm.createContext({ self: { postMessage: (m) => messages.push(m) }, Math, Map });
  vm.runInContext(src, ctx);
  return { ctx, messages };
}

function image(w, h, colorAt) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, g, b] = colorAt(x, y);
    data.set([r, g, b, 255], (y * w + x) * 4);
  }
  return { data, width: w, height: h };
}

test('quantize separates two flat colors', () => {
  const { ctx } = load();
  const img = image(40, 20, (x) => (x < 20 ? [255, 0, 0] : [0, 0, 255]));
  const { palette, idMap } = ctx.quantize(img, 2, () => {});
  assert.notEqual(idMap[0], idMap[39]);
  assert.deepEqual({ ...palette[idMap[0]] }, { r: 255, g: 0, b: 0 });
  assert.deepEqual({ ...palette[idMap[39]] }, { r: 0, g: 0, b: 255 });
});

test('quantize on a subsampled large image still assigns every pixel', () => {
  const { ctx } = load();
  const w = 800, h = 700; // > 250k px, so the strided fit is used
  const img = image(w, h, (x, y) => (y < 350 ? [20, 160, 60] : [240, 220, 40]));
  const { idMap } = ctx.quantize(img, 2, () => {});
  assert.equal(idMap.length, w * h);
  assert.notEqual(idMap[0], idMap[w * h - 1]);
  assert.equal(idMap[0], idMap[w * 349 + 799]);
});

test('labelRegions finds 4-connected components with pixel counts and bboxes', () => {
  const { ctx } = load();
  // 0 0 1
  // 1 0 1
  // 1 1 0   <- bottom-right 0 touches the others only diagonally
  const idMap = Uint16Array.from([0, 0, 1, 1, 0, 1, 1, 1, 0]);
  const { regions, regionMap } = ctx.labelRegions(idMap, 3, 3);
  assert.equal(regions.length, 4);
  assert.deepEqual(Array.from(regions, (r) => r.pixels).sort(), [1, 2, 3, 3]); // Array.from: vm realm -> test realm
  assert.notEqual(regionMap[0], regionMap[8]);
  const first = regions[regionMap[0]];
  assert.deepEqual([...first.bbox], [0, 0, 1, 1]);
});

test('mergeTiny folds a speck into its surrounding region', () => {
  const { ctx } = load();
  const w = 10, h = 10;
  const idMap = new Uint16Array(w * h);
  idMap[5 * w + 5] = 1;
  const { regions, regionMap } = ctx.labelRegions(idMap, w, h);
  ctx.mergeTiny(regions, regionMap, idMap, w, h, 4);
  assert.equal(idMap[5 * w + 5], 0);
  assert.equal(ctx.labelRegions(idMap, w, h).regions.length, 1);
});

test('innerPoint lies inside a concave (L-shaped) region', () => {
  const { ctx } = load();
  const w = 40, h = 40;
  const idMap = new Uint16Array(w * h).fill(1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x < 12 || y >= 28) idMap[y * w + x] = 0; // L: left bar + bottom bar
  }
  const { regions, regionMap } = ctx.labelRegions(idMap, w, h);
  const L = regions.find((r) => r.colorId === 0);
  const p = ctx.innerPoint(L, regionMap, w, h);
  assert.equal(regionMap[p.y * w + p.x], L.id);
  assert.ok(p.radius >= 4);
});

test('makeNumbering numbers colors by area and yields one number per visual field', () => {
  const { ctx } = load();
  const w = 60, h = 30;
  const idMap = new Uint16Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 40; x < w; x++) idMap[y * w + x] = 1;
  const { regions, regionMap } = ctx.labelRegions(idMap, w, h);
  const out = ctx.makeNumbering(regions, regionMap, idMap, w, h);
  assert.equal(out.colorToNum.get(0), 1); // larger area
  assert.equal(out.colorToNum.get(1), 2);
  assert.equal(out.numbers.length, 2);
});

test('two areas joined by a 1 px neck get a number each', async () => {
  const { ctx, messages } = load();
  const w = 120, h = 60;
  // two red blocks connected by a one-pixel-high bridge across a blue background
  const red = (x, y) => (x >= 10 && x < 50 && y >= 10 && y < 50) || (x >= 70 && x < 110 && y >= 10 && y < 50) || (y === 30 && x >= 50 && x < 70);
  const img = image(w, h, (x, y) => (red(x, y) ? [220, 30, 30] : [30, 30, 220]));
  await ctx.self.onmessage({ data: { imageData: img, k: 2, minPxFactor: 0.0001 } });
  const done = messages.find((m) => m.type === 'done');
  const redNum = done.payload.numbers.filter((n) => red(n.cx, n.cy));
  assert.equal(redNum.length, 2);
  assert.ok(redNum.some((n) => n.cx < 50) && redNum.some((n) => n.cx >= 70));
});

test('full pipeline posts progress and a done message with matching sizes', async () => {
  const { ctx, messages } = load();
  const w = 64, h = 48;
  const img = image(w, h, (x, y) => (x < 32 ? [200, 30, 30] : y < 24 ? [30, 30, 200] : [30, 200, 30]));
  await ctx.self.onmessage({ data: { imageData: img, k: 3, minPxFactor: 0.0004 } });
  const done = messages.find((m) => m.type === 'done');
  assert.ok(done, JSON.stringify(messages.find((m) => m.type === 'error')));
  assert.equal(done.payload.lineImage.length, w * h * 4);
  assert.equal(done.payload.palette.length, 3);
  assert.equal(done.payload.numbers.length, 3);
  assert.ok(messages.some((m) => m.type === 'progress'));
});

test('every file the service worker precaches exists (one 404 voids the whole precache)', async () => {
  const { existsSync } = await import('node:fs');
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const list = sw.match(/const FILES = \[(.*?)\];/s)[1].match(/'([^']+)'/g).map((f) => f.slice(1, -1));
  assert.ok(list.length > 3);
  for (const f of list) if (f !== './') assert.ok(existsSync(new URL('../' + f, import.meta.url)), f + ' missing');
});
