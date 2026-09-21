// Regenerates the README screenshots in docs/screenshots/. Deliberately not part of `npm test`
// (the project has no dependencies): run it through a Playwright runner that hands in `page`,
// e.g. the Playwright MCP `browser_run_code` tool with `filename`, while `npm start` serves :8000.
async (page) => {
  const url = 'http://localhost:8000/';
  const dir = 'docs/screenshots/';
  await page.setViewportSize({ width: 1180, height: 820 }); // iPad landscape
  await page.goto(url);
  // The service worker serves assets cache-first — drop it so the current files are used.
  await page.evaluate(async () => {
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for (const k of await caches.keys()) await caches.delete(k);
  });
  await page.reload();
  await page.evaluate(async () => { for (const p of await dbListMeta()) await dbDel(p.id); });
  await page.click('#try-example');
  await page.waitForSelector('#screen-prep.active');
  await page.screenshot({ path: dir + 'setup.png' });

  await page.click('#generate-btn');
  await page.waitForSelector('#screen-paint.active', { timeout: 90000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: dir + 'template.png' });

  // Paint like a user: brush strokes in the palette colors of the fields they cross.
  await page.evaluate(() => {
    const ctx = document.querySelector('#canvas-paint').getContext('2d');
    const W = state.width, H = state.height;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 46;
    [[0.84, 1], [0.9, 2], [0.78, 12], [0.12, 3], [0.18, 5]].forEach(([fy, nr]) => {
      ctx.strokeStyle = state.palette[Math.min(nr, state.palette.length) - 1].hex;
      ctx.beginPath();
      for (let px = 0.04 * W; px < 0.62 * W; px += 30) ctx.lineTo(px, fy * H + 10 * Math.sin(px / 50));
      ctx.stroke();
    });
    updateProgress();
    document.querySelector('#project-name').value = state.projectName = 'Sleeping cat';
  });
  await page.screenshot({ path: dir + 'painting.png' });

  await page.click('#paint-back');
  await page.waitForSelector('#screen-start.active');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: dir + 'start.png' });
  return 'ok';
}
