import html2canvas from 'html2canvas';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Renders the export HTML in a hidden, off-screen iframe so the map/chart's own init script
// runs exactly as it would in the real embed, then waits for it to signal completion.
async function renderInHiddenIframe(html, width) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `position:fixed; left:-99999px; top:0; width:${width}px; height:1400px; border:0;`;
  iframe.sandbox = 'allow-scripts allow-same-origin';
  document.body.appendChild(iframe);

  await new Promise((resolve) => {
    iframe.addEventListener('load', resolve, { once: true });
    iframe.srcdoc = html;
  });

  await new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      const win = iframe.contentWindow;
      if ((win && win.__RENDER_READY__) || Date.now() - start > 2500) return resolve();
      setTimeout(check, 100);
    };
    check();
  });

  return iframe;
}

// html2canvas can't reliably read fill colors set via JS setAttribute() on SVG <path> elements
// (its inline-SVG support is best-effort), so the map's <svg> is rasterized separately here -
// as a plain (non-foreignObject) SVG image, which draws onto canvas without tainting it - and
// composited over whatever html2canvas rendered for the surrounding card/legend/text.
async function rasterizeSvgElement(svgEl, targetWidth, targetHeight) {
  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', targetWidth);
  clone.setAttribute('height', targetHeight);
  const markup = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Térkép rasterizálása sikertelen.'));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Client-side PNG export: no backend involved. Renders the generated embed HTML in a hidden
 * iframe and rasterizes it with html2canvas (which redraws the DOM onto a canvas node-by-node,
 * unlike the SVG-foreignObject approach, so the result isn't a "tainted" canvas and can be
 * read back out as PNG bytes).
 */
export async function exportPng(html, { width = 1000, scale = 1, filename = 'infografika.png' } = {}) {
  const iframe = await renderInHiddenIframe(html, width);
  try {
    const doc = iframe.contentDocument;
    const wrap = doc.querySelector('.data-visual-wrap');
    if (!wrap) throw new Error('Nem található exportálható tartalom az előnézetben.');

    const svgEl = wrap.querySelector('svg');
    const wrapRect = wrap.getBoundingClientRect();

    const canvas = await html2canvas(wrap, {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      ignoreElements: (el) => el.tagName === 'svg'
    });

    if (svgEl) {
      const svgRect = svgEl.getBoundingClientRect();
      const offsetX = (svgRect.left - wrapRect.left) * scale;
      const offsetY = (svgRect.top - wrapRect.top) * scale;
      const targetW = svgRect.width * scale;
      const targetH = svgRect.height * scale;
      const svgImg = await rasterizeSvgElement(svgEl, targetW, targetH);
      canvas.getContext('2d').drawImage(svgImg, offsetX, offsetY, targetW, targetH);
    }

    const pngBlob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG generálása sikertelen.'))), 'image/png');
    });
    downloadBlob(pngBlob, filename);
  } finally {
    iframe.remove();
  }
}

/**
 * Client-side SVG export for the map engine - the live-preview iframe already
 * contains a real <svg>, so this just serializes and downloads it, no backend needed.
 */
export function exportSvgFromIframe(iframe, filename = 'infografika.svg') {
  const svg = iframe?.contentDocument?.querySelector('svg');
  if (!svg) {
    throw new Error('Nem található SVG a jelenlegi előnézetben (csak a térkép motorhoz érhető el).');
  }
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const source = new XMLSerializer().serializeToString(clone);
  downloadBlob(new Blob([source], { type: 'image/svg+xml' }), filename);
}
