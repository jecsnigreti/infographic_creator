import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  }
  return browserPromise;
}

// Single stateless endpoint: render the client-generated embed HTML headlessly and
// return a PNG. No database, no accounts, no saved visualizations — the caller sends
// the full HTML each time and gets bytes back.
app.post('/api/export/png', async (req, res) => {
  const { html, width, scale } = req.body || {};
  if (!html || typeof html !== 'string') {
    return res.status(400).json({ error: 'Missing "html" string in request body' });
  }
  const viewportWidth = Math.max(200, Math.min(3000, Number(width) || 900));
  const deviceScaleFactor = [1, 2].includes(Number(scale)) ? Number(scale) : 1;

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: viewportWidth, height: 1200, deviceScaleFactor });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForFunction('window.__RENDER_READY__ === true', { timeout: 8000 }).catch(() => {});

    const target = (await page.$('.data-visual-wrap')) || (await page.$('body'));
    // Puppeteer returns a plain Uint8Array (not a Node Buffer) by default; Express's
    // res.send() only recognizes actual Buffers as binary, so wrap it explicitly —
    // otherwise it gets JSON-serialized instead of sent as raw image bytes.
    const buffer = Buffer.from(await target.screenshot({ type: 'png' }));

    res.set('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    console.error('PNG export failed:', err);
    res.status(500).json({ error: 'Render failed', message: err.message });
  } finally {
    if (page) await page.close();
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`PNG export server listening on http://localhost:${PORT}`);
});
