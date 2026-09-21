// Regenerates the README screenshots in docs/screenshots/. Deliberately not part of `npm test`
// (the project has no dependencies): run it through a Playwright runner that hands in `page`,
// e.g. the Playwright MCP `browser_run_code` tool with `filename`, while `npm start` serves :8000.
async (page) => {
  const url = 'http://localhost:8000/';
  const dir = 'docs/screenshots/';
  await page.setViewportSize({ width: 1180, height: 820 }); // iPad landscape
  await page.goto(url);
  await page.evaluate(async () => {
    for (const p of await dbListMeta()) await dbDel(p.id);
    // Synthetic "photo": sky, sun, hills, lake — no third-party image in the repo.
    const c = document.createElement('canvas');
    c.width = 1800; c.height = 1200;
    const x = c.getContext('2d');
    const sky = x.createLinearGradient(0, 0, 0, 800);
    sky.addColorStop(0, '#1d4e89'); sky.addColorStop(0.6, '#f7b267'); sky.addColorStop(1, '#f25c54');
    x.fillStyle = sky; x.fillRect(0, 0, 1800, 1200);
    x.fillStyle = '#fff3c4'; x.beginPath(); x.arc(1250, 520, 150, 0, 7); x.fill();
    const hills = [['#5b3a6b', 700, 260], ['#3d2c5a', 790, 200], ['#22304f', 880, 150]];
    for (const [col, base, amp] of hills) {
      x.fillStyle = col; x.beginPath(); x.moveTo(0, 1200);
      for (let i = 0; i <= 1800; i += 20) x.lineTo(i, base - amp * Math.abs(Math.sin(i / 330 + base)));
      x.lineTo(1800, 1200); x.fill();
    }
    const lake = x.createLinearGradient(0, 900, 0, 1200);
    lake.addColorStop(0, '#f4845f'); lake.addColorStop(1, '#14213d');
    x.fillStyle = lake; x.fillRect(0, 930, 1800, 270);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
    await loadFromFile(new File([blob], 'sunset.jpg', { type: 'image/jpeg' }));
  });
  await page.waitForSelector('#screen-prep.active');
  await page.screenshot({ path: dir + 'setup.png' });

  await page.click('#generate-btn');
  await page.waitForSelector('#screen-paint.active', { timeout: 90000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: dir + 'template.png' });

  // Fill a few fields with their own colors so the painting screenshot shows work in progress.
  await page.evaluate(() => {
    const ctx = document.querySelector('#canvas-paint').getContext('2d');
    const pick = (nr) => state.palette[Math.min(nr, state.palette.length) - 1].hex;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[1, 1050], [2, 1120], [3, 990]].forEach(([nr, y], i) => {
      ctx.strokeStyle = pick(nr); ctx.lineWidth = 70;
      ctx.beginPath(); ctx.moveTo(80, y);
      for (let px = 80; px < 1100 - i * 250; px += 40) ctx.lineTo(px, y + 18 * Math.sin(px / 60));
      ctx.stroke();
    });
    updateProgress();
    document.querySelector('#project-name').value = state.projectName = 'Sunset lake';
  });
  await page.screenshot({ path: dir + 'painting.png' });

  await page.click('#paint-back');
  await page.waitForSelector('#screen-start.active');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: dir + 'start.png' });
  return 'ok';
}
