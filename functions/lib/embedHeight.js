// Estimates the pixel height an exported widget will actually render at, so the hosted-link
// iframe (built from a stored, fixed width of 900px) can be sized to match instead of using one
// flat height for every map/chart - which either wastes space or forces an unwanted scrollbar.
// Reads cues straight out of the generated HTML (aspect-ratio for maps, min-height for charts,
// presence of header/footer blocks) rather than duplicating exporter.js's map/config data here.
export function estimateEmbedHeight(html, iframeWidth = 900) {
  const configMatch = html.match(/<script id="config_[^"]*" type="application\/json">\s*([\s\S]*?)\s*<\/script>/);
  let cfg = {};
  try {
    cfg = configMatch ? JSON.parse(configMatch[1]) : {};
  } catch (err) {
    cfg = {};
  }

  const WRAP_PADDING = 64; // 2rem top + 2rem bottom on .data-visual-wrap
  const HEADER = (cfg.title || cfg.subtitle) ? 70 : 0;
  const FOOTER = cfg.source ? 30 : 0;
  const BUFFER = 24; // small safety margin so a slight under-estimate doesn't force a scrollbar

  let contentHeight;
  if (cfg.engine === 'map') {
    const ratioMatch = html.match(/aspect-ratio:\s*(\d+)\s*\/\s*(\d+)/);
    if (ratioMatch) {
      const vbW = Number(ratioMatch[1]);
      const vbH = Number(ratioMatch[2]);
      contentHeight = Math.round(iframeWidth * (vbH / vbW));
    } else {
      contentHeight = 500;
    }
  } else {
    const heightMatch = html.match(/min-height:\s*(\d+)px/);
    contentHeight = heightMatch ? Number(heightMatch[1]) : 400;
  }

  return Math.max(300, Math.min(2000, contentHeight + WRAP_PADDING + HEADER + FOOTER + BUFFER));
}
