// Regenerates the landing-page pictures derived from `example.jpg` (the sample photo in the repo root)
// by running it through the real pipeline. Writes PNGs to `tests/.out/`; `tests/feature-assets.py` converts:
//   example-after.png  template, left part painted field by field   -> example-after.jpg
//   step-template.png  the bare template                            -> step-2.jpg
//   step-painted.png   every numbered field painted                 -> step-3.jpg
// Run through a Playwright runner that hands in `page` while `npm start` serves :8000.
async (page) => {
  const W = 1200, H = 900;
  const PRESET = 'standard'; // keep in sync with the figcaption and `try-example` in index.html
  await page.setViewportSize({ width: W, height: H });
  await page.goto('http://localhost:8000/');
  // The service worker serves assets cache-first — drop it so the current files are used.
  await page.evaluate(async () => {
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for (const k of await caches.keys()) await caches.delete(k);
  });
  await page.reload();
  await page.evaluate(async (preset) => {
    const orig = window.finishTemplate;
    window.finishTemplate = (payload) => { window.__payload = payload; return orig(payload); };
    await loadFromFile(new File([await (await fetch('example.jpg')).blob()], 'example.jpg', { type: 'image/jpeg' }));
    selectPreset(preset);
  }, PRESET);

  await page.click('#generate-btn');
  await page.waitForSelector('#screen-paint.active', { timeout: 90000 });

  const compose = (mode) => page.evaluate(([W, H, mode]) => {
    // Paint the way a user would: every numbered field is flood-filled with its palette color,
    // bounded by the worker's own outline mask. mode: 'half' (left of a slanted edge), 'full', 'none'.
    const out = document.createElement('canvas');
    out.width = W; out.height = H;
    const o = out.getContext('2d');
    o.fillStyle = '#fff'; o.fillRect(0, 0, W, H);
    const flat = o.getImageData(0, 0, W, H);
    const { lineImage, numbers } = window.__payload;
    const seen = new Uint8Array(W * H);
    const stack = new Int32Array(W * H * 4); // pixels can be pushed once per neighbour
    for (const n of (mode === 'none' ? [] : numbers)) {
      const c = state.palette[n.num - 1];
      let sp = 0;
      stack[sp++] = n.cy * W + n.cx;
      while (sp) {
        const p = stack[--sp];
        if (seen[p] || lineImage[p * 4 + 3]) continue;
        seen[p] = 1;
        const px = p % W, py = (p / W) | 0;
        if (mode === 'full' || px <= W * 0.58 - (py - H / 2) * 0.35) { flat.data[p * 4] = c.r; flat.data[p * 4 + 1] = c.g; flat.data[p * 4 + 2] = c.b; }
        if (px > 0) stack[sp++] = p - 1;
        if (px < W - 1) stack[sp++] = p + 1;
        if (py > 0) stack[sp++] = p - W;
        if (py < H - 1) stack[sp++] = p + W;
      }
    }
    o.putImageData(flat, 0, 0);
    o.globalCompositeOperation = 'multiply';
    o.drawImage(document.querySelector('#canvas-template'), 0, 0, W, H);
    const old = document.querySelector('#shot'); if (old) old.remove();
    out.id = 'shot';
    out.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99999`;
    document.body.appendChild(out);
  }, [W, H, mode]);
  for (const [mode, name] of [['half', 'example-after'], ['none', 'step-template'], ['full', 'step-painted']]) {
    await compose(mode);
    await page.locator('#shot').screenshot({ path: `tests/.out/${name}.png` });
  }
  await page.evaluate(async () => { for (const p of await dbListMeta()) await dbDel(p.id); });
  return 'ok';
}
