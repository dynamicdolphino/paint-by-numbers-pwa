// Regenerates the landing-page example (docs: README "Sample Output" uses the screenshots script instead).
// Writes PNGs to the scratch folder `tests/.out/`; convert them afterwards:
//   example.jpg        <- example-photo.png   (the sample "photo", also loaded by "Try the example")
//   example-after.jpg  <- example-after.png   (its template, partly painted, produced by the real pipeline)
// Run through a Playwright runner that hands in `page` while `npm start` serves :8000.
async (page) => {
  const W = 1200, H = 800;
  await page.setViewportSize({ width: W, height: H });
  await page.goto('http://localhost:8000/');
  await page.evaluate(async ([W, H]) => {
    // Procedural scene — no third-party image in the repo.
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    const sky = x.createLinearGradient(0, 0, 0, H * 0.66);
    sky.addColorStop(0, '#16396b'); sky.addColorStop(0.45, '#8a5a9e'); sky.addColorStop(0.75, '#f79d65'); sky.addColorStop(1, '#f9c784');
    x.fillStyle = sky; x.fillRect(0, 0, W, H);
    const glow = x.createRadialGradient(820, 400, 40, 820, 400, 380);
    glow.addColorStop(0, 'rgba(255,236,170,0.9)'); glow.addColorStop(1, 'rgba(255,236,170,0)');
    x.fillStyle = glow; x.fillRect(0, 0, W, H);
    x.fillStyle = '#fff1bf'; x.beginPath(); x.arc(820, 400, 92, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,214,186,0.85)';
    for (const [cx, cy, s] of [[230, 150, 1], [520, 95, 0.7], [1010, 170, 0.85]]) {
      for (const [dx, dy, r] of [[0, 0, 46], [52, 10, 38], [-50, 12, 34], [100, 18, 26]]) {
        x.beginPath(); x.ellipse(cx + dx * s, cy + dy * s, r * s * 1.5, r * s * 0.62, 0, 0, 7); x.fill();
      }
    }
    const ridge = (col, base, amp, f, ph) => {
      x.fillStyle = col; x.beginPath(); x.moveTo(0, H);
      for (let i = 0; i <= W; i += 8) x.lineTo(i, base - amp * (0.6 * Math.abs(Math.sin(i / f + ph)) + 0.4 * Math.sin(i / (f * 0.37) + ph * 2)));
      x.lineTo(W, H); x.fill();
    };
    ridge('#6d4a8c', 470, 190, 260, 0.4);
    ridge('#46336e', 520, 150, 210, 1.9);
    ridge('#2b2a55', 560, 95, 170, 3.1);
    const lake = x.createLinearGradient(0, 560, 0, H);
    lake.addColorStop(0, '#f6a66b'); lake.addColorStop(0.35, '#b0608a'); lake.addColorStop(1, '#141b3d');
    x.fillStyle = lake; x.fillRect(0, 560, W, H - 560);
    x.fillStyle = 'rgba(255,238,180,0.75)';
    for (let i = 0; i < 9; i++) { const w = 150 - i * 12; x.fillRect(820 - w / 2, 575 + i * 22, w, 9); }
    x.fillStyle = '#10142b'; x.beginPath(); x.moveTo(0, H); x.lineTo(0, 640);
    for (let i = 0; i <= 430; i += 10) x.lineTo(i, 640 + i * 0.22 + 14 * Math.sin(i / 35));
    x.lineTo(470, H); x.fill();
    for (const [tx, th] of [[70, 250], [150, 190], [235, 290], [320, 170]]) {
      const by = 650 + tx * 0.22;
      x.fillStyle = '#10142b';
      for (let k = 0; k < 5; k++) {
        const y0 = by - th + k * th * 0.17, half = 16 + k * 13;
        x.beginPath(); x.moveTo(tx, y0); x.lineTo(tx - half, y0 + th * 0.3); x.lineTo(tx + half, y0 + th * 0.3); x.fill();
      }
      x.fillRect(tx - 5, by - 30, 10, 40);
    }
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    window.__photo = c;
    const orig = window.finishTemplate;
    window.finishTemplate = (payload) => { window.__payload = payload; return orig(payload); };
    await loadFromFile(new File([blob], 'example.png', { type: 'image/png' }));
    selectPreset('easy');
  }, [W, H]);

  await page.click('#generate-btn');
  await page.waitForSelector('#screen-paint.active', { timeout: 90000 });

  await page.evaluate(([W, H]) => {
    // "After": the real template on white; left of a slanted edge every numbered field is
    // flood-filled with its palette color — bounded by the worker's own outline mask.
    const out = document.createElement('canvas');
    out.width = W; out.height = H;
    const o = out.getContext('2d');
    o.fillStyle = '#fff'; o.fillRect(0, 0, W, H);
    const flat = o.getImageData(0, 0, W, H);
    const { lineImage, numbers } = window.__payload;
    const seen = new Uint8Array(W * H);
    const stack = new Int32Array(W * H * 4); // pixels can be pushed once per neighbour
    for (const n of numbers) {
      const c = state.palette[n.num - 1];
      let sp = 0;
      stack[sp++] = n.cy * W + n.cx;
      while (sp) {
        const p = stack[--sp];
        if (seen[p] || lineImage[p * 4 + 3]) continue;
        seen[p] = 1;
        const px = p % W, py = (p / W) | 0;
        if (px <= W * 0.58 - (py - H / 2) * 0.35) { flat.data[p * 4] = c.r; flat.data[p * 4 + 1] = c.g; flat.data[p * 4 + 2] = c.b; }
        if (px > 0) stack[sp++] = p - 1;
        if (px < W - 1) stack[sp++] = p + 1;
        if (py > 0) stack[sp++] = p - W;
        if (py < H - 1) stack[sp++] = p + W;
      }
    }
    o.putImageData(flat, 0, 0);
    o.globalCompositeOperation = 'multiply';
    o.drawImage(document.querySelector('#canvas-template'), 0, 0, W, H);
    for (const [id, cv] of [['shot-photo', window.__photo], ['shot-after', out]]) {
      cv.id = id;
      cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99999`;
      document.body.appendChild(cv);
    }
  }, [W, H]);
  await page.locator('#shot-after').screenshot({ path: 'tests/.out/example-after.png' });
  await page.evaluate(() => document.querySelector('#shot-after').remove());
  await page.locator('#shot-photo').screenshot({ path: 'tests/.out/example-photo.png' });
  await page.evaluate(async () => { for (const p of await dbListMeta()) await dbDel(p.id); });
  return 'ok';
}
