// Renders the app icons and the social preview from docs/logo.svg. Deliberately not part of `npm test`
// (the project has no dependencies): run it through a Playwright runner that hands in `page`,
// e.g. the Playwright MCP `browser_run_code` tool with `filename`, while `npm start` serves :8000.
async (page) => {
  const base = 'http://localhost:8000/';
  const svg = await (await page.request.get(base + 'docs/logo.svg')).text();
  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  // Icons: the SVG at 512 and 192 px, opaque tile (iOS ignores transparency anyway).
  for (const size of [512, 192]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:#F4F4F5"><img src="${svgUrl}" width="${size}" height="${size}" style="display:block"></body></html>`);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `icon-${size}.png`, clip: { x: 0, y: 0, width: size, height: size } });
  }

  // Social preview 1200x630: mark + name + one line, the example template on the right.
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<!doctype html><html><body style="margin:0;width:1200px;height:630px;background:#0E0E10;color:#F4F4F5;
      font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',system-ui,sans-serif;position:relative;overflow:hidden">
    <div style="position:absolute;left:72px;top:72px;display:flex;align-items:center;gap:20px">
      <img src="${svgUrl}" width="72" height="72" style="display:block;border-radius:16px">
      <span style="font-size:30px;font-weight:600;letter-spacing:-0.01em">Paint by Numbers</span>
    </div>
    <h1 style="position:absolute;left:72px;top:216px;margin:0;width:560px;font-size:64px;line-height:1.02;letter-spacing:-0.035em;font-weight:700">
      Turn your photo into a <span style="color:#F0762E">paint-by-numbers</span> template.</h1>
    <p style="position:absolute;left:72px;top:452px;margin:0;width:520px;font-size:24px;line-height:1.4;color:rgba(244,244,245,0.68)">
      Free, private, works offline. Paint on screen with Apple Pencil or print it as a PDF.</p>
    <img src="${base}example-after.jpg" width="640" height="480" style="position:absolute;left:700px;top:96px;border-radius:24px;object-fit:cover;box-shadow:0 30px 80px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.12)">
  </body></html>`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'og-image.png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  return 'ok';
}
