// Regenerates the raw material for the landing-page feature pictures into `tests/.out/`:
//   levels-kids.png / levels-fine.png  templates of the example at the lowest and highest detail level
//   feat-paint.png                     the paint screen (light theme) with a partly painted example
//   print-1.pdf / print-2.pdf          the two pages of the real PDF export
// `tests/feature-assets.py` turns them into feat-levels.jpg, feat-paint.jpg and feat-print.jpg.
// Run through a Playwright runner that hands in `page` while `npm start` serves :8000.
async (page) => {
  const out = 'tests/.out/';
  await page.setViewportSize({ width: 1200, height: 760 });
  await page.goto('http://localhost:8000/');
  await page.evaluate(() => { localStorage.setItem('theme', 'light'); });
  await page.reload();
  await page.evaluate(async () => {
    for (const p of await dbListMeta()) await dbDel(p.id);
    const orig = window.finishTemplate;
    window.finishTemplate = (payload) => { window.__payload = payload; return orig(payload); };
  });

  const generate = async (preset) => {
    await page.click('#try-example');
    await page.waitForSelector('#screen-prep.active');
    await page.evaluate((id) => selectPreset(id), preset);
    await page.click('#generate-btn');
    await page.waitForSelector('#screen-paint.active', { timeout: 90000 });
    await page.waitForTimeout(500);
  };
  const shootTemplate = async (name) => {
    await page.evaluate(() => {
      const src = document.querySelector('#canvas-template');
      const c = document.createElement('canvas');
      c.width = src.width; c.height = src.height;
      const x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(src, 0, 0);
      c.id = 'shot';
      c.style.cssText = 'position:fixed;left:0;top:0;width:1200px;height:800px;z-index:99999';
      document.body.appendChild(c);
    });
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.locator('#shot').screenshot({ path: out + name });
    await page.evaluate(() => document.querySelector('#shot').remove());
    await page.setViewportSize({ width: 1200, height: 760 });
  };

  for (const preset of ['kids', 'fine']) {
    await generate(preset);
    await shootTemplate(`levels-${preset}.png`);
    await page.click('#paint-back');
    await page.waitForSelector('#screen-start.active');
  }

  // Paint screen: fill the fields on the left two thirds the way a user would, field by field.
  await generate('easy');
  await page.evaluate(() => {
    const W = state.width, H = state.height;
    const { lineImage, numbers } = window.__payload;
    const ctx = document.querySelector('#canvas-paint').getContext('2d');
    const img = ctx.getImageData(0, 0, W, H);
    const seen = new Uint8Array(W * H);
    const stack = new Int32Array(W * H * 4);
    for (const n of numbers) {
      if (n.cx > W * 0.62) continue;
      const c = state.palette[n.num - 1];
      let sp = 0;
      stack[sp++] = n.cy * W + n.cx;
      while (sp) {
        const p = stack[--sp];
        if (seen[p] || lineImage[p * 4 + 3]) continue;
        seen[p] = 1;
        img.data[p * 4] = c.r; img.data[p * 4 + 1] = c.g; img.data[p * 4 + 2] = c.b;
        const px = p % W, py = (p / W) | 0;
        if (px > 0) stack[sp++] = p - 1;
        if (px < W - 1) stack[sp++] = p + 1;
        if (py > 0) stack[sp++] = p - W;
        if (py < H - 1) stack[sp++] = p + W;
      }
    }
    ctx.putImageData(img, 0, 0);
    updateProgress();
    document.querySelector('#project-name').value = state.projectName = 'Sunset lake';
    document.querySelectorAll('#palette .swatch')[5].click();
  });
  await page.screenshot({ path: out + 'feat-paint.png' });

  // Real PDF export, then one file per page so a PDF rasteriser that only renders page 1 can be used.
  // Where the browser can share files the app shows its save sheet first; "Download" is the same path then.
  await page.evaluate(() => {
    const orig = window.triggerDownload;
    window.triggerDownload = (blob, name) => { if (!window.__pdfBlob) window.__pdfBlob = blob; return orig(blob, name); };
  });
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    (async () => {
      await page.evaluate(() => exportPDF());
      if (await page.locator('#save-sheet.active').count()) await page.click('#save-sheet-open');
    })(),
  ]);
  await download.saveAs(out + 'print.pdf');
  for (const i of [0, 1]) {
    const [d] = await Promise.all([
      page.waitForEvent('download'),
      page.evaluate(async (i) => {
        const bytes = await window.__pdfBlob.arrayBuffer();
        const src = await PDFLib.PDFDocument.load(bytes);
        const one = await PDFLib.PDFDocument.create();
        const [pg] = await one.copyPages(src, [i]);
        one.addPage(pg);
        triggerDownload(new Blob([await one.save()], { type: 'application/pdf' }), `print-${i + 1}.pdf`);
      }, i),
    ]);
    await d.saveAs(out + `print-${i + 1}.pdf`);
  }
  await page.evaluate(async () => {
    for (const p of await dbListMeta()) await dbDel(p.id);
    localStorage.removeItem('theme');
  });
  return 'ok';
}
