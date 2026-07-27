const DEFAULT_ENDPOINT = 'http://localhost:4000/api/export/png';

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

/**
 * Renders the generated embed HTML headlessly (via the stateless server/ PNG service)
 * and downloads the result. Throws if the server isn't reachable — callers should
 * surface that as "start the export server" rather than a generic error.
 */
export async function exportPng(html, { width = 900, scale = 1, filename = 'infografika.png', endpoint = DEFAULT_ENDPOINT } = {}) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, width, scale })
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `PNG export failed (${res.status})`);
  }
  downloadBlob(await res.blob(), filename);
}

/**
 * Client-side SVG export for the map engine — the live-preview iframe already
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
