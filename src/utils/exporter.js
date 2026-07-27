import { HUNGARY_COUNTIES } from './maps/hungary-counties.js';
import { USA_STATES_HIGH_RES } from './maps/usa-high-res.js';
import { WORLD_COUNTRIES } from './maps/world-countries.js';
import { AFRICA_COUNTRIES } from './maps/africa-countries.js';
import { EU_MEMBERS } from './maps/eu-members.js';
import { MIDDLE_EAST } from './maps/middle-east.js';
import { AUSTRALIA_STATES } from './maps/australia-states.js';
import { GERMANY_STATES } from './maps/germany-states.js';
import { FRANCE_REGIONS } from './maps/france-regions.js';
import { ITALY_REGIONS } from './maps/italy-regions.js';
import { SPAIN_REGIONS } from './maps/spain-regions.js';
import { POLAND_VOIVODESHIPS } from './maps/poland-voivodeships.js';
import { ROMANIA_REGIONS } from './maps/romania-regions.js';
import { NETHERLANDS_PROVINCES } from './maps/netherlands-provinces.js';
import { AUSTRIA_STATES } from './maps/austria-states.js';

const MAP_TEMPLATES = {
  'usa-high-res': { regions: USA_STATES_HIGH_RES, viewBox: '0 0 1000 600' },
  world: { regions: WORLD_COUNTRIES, viewBox: '0 0 1000 600' },
  africa: { regions: AFRICA_COUNTRIES, viewBox: '0 0 1000 800' },
  eu: { regions: EU_MEMBERS, viewBox: '0 0 1050 900' },
  'middle-east': { regions: MIDDLE_EAST, viewBox: '0 0 1000 800' },
  australia: { regions: AUSTRALIA_STATES, viewBox: '0 0 1000 800' },
  'hu-counties': { regions: HUNGARY_COUNTIES, viewBox: '0 0 1000 600' },
  'de-states': { regions: GERMANY_STATES, viewBox: '0 0 1000 900' },
  'fr-regions': { regions: FRANCE_REGIONS, viewBox: '0 0 1000 900' },
  'it-regions': { regions: ITALY_REGIONS, viewBox: '0 0 1000 900' },
  'es-regions': { regions: SPAIN_REGIONS, viewBox: '0 0 1000 900' },
  'pl-voivodeships': { regions: POLAND_VOIVODESHIPS, viewBox: '0 0 1000 900' },
  'ro-regions': { regions: ROMANIA_REGIONS, viewBox: '0 0 1000 900' },
  'nl-provinces': { regions: NETHERLANDS_PROVINCES, viewBox: '0 0 1000 900' },
  'at-states': { regions: AUSTRIA_STATES, viewBox: '0 0 1000 900' }
};

function minifyCss(str) {
  return str.replace(/\/\*.*?\*\//gs, '').replace(/\s+/g, ' ').replace(/ {\s+/g, '{').replace(/:\s+/g, ':').replace(/;\s+/g, ';').replace(/;}/g, '}').trim();
}

function minifyJs(str) {
  return str.replace(/\/\*.*?\*\//gs, '').replace(/\/\/.*?\n/g, '').replace(/\s+/g, ' ').replace(/ {\s+/g, '{').replace(/;\s+/g, ';').replace(/}\s+/g, '}').trim();
}

const FORMAT_VALUE_JS_SRC = `
    function formatValue(val, cfg) {
      if (typeof val !== 'number' || isNaN(val)) return val;
      const nf = (cfg && cfg.numberFormat) || {};
      let n = val;
      if (nf.decimals != null) n = Number(n.toFixed(nf.decimals));
      let s;
      if (nf.type === 'percent') s = n.toLocaleString() + '%';
      else if (nf.type === 'currency') s = n.toLocaleString() + ' Ft';
      else if (nf.type === 'plain') s = String(n);
      else s = n.toLocaleString();
      return s + (nf.suffix ? ' ' + nf.suffix : '');
    }
`;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function generateDataVisualCode(database, mapping, engine, config) {
  const uniqueId = `div_${Math.random().toString(36).substring(2, 9)}`;
  const dataNodeId = `data_${Math.random().toString(36).substring(2, 9)}`;

  // Filter labels and multiple values
  const labelCol = Object.keys(mapping).find(k => (mapping[k] || []).includes('label'));
  const valueCols = Object.keys(mapping).filter(k => (mapping[k] || []).includes('value'));
  const geoCol = Object.keys(mapping).find(k => (mapping[k] || []).includes('geoId'));
  // Meta columns add extra descriptive context to tooltips; a column already used as a value keeps its numeric role.
  const metaCols = Object.keys(mapping).filter(k => (mapping[k] || []).includes('meta') && !valueCols.includes(k));

  const cleanedData = database.data.map(row => {
    const item = {
      label: labelCol ? row[labelCol] : 'Unknown',
      geoId: geoCol ? String(row[geoCol]).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-') : null
    };
    valueCols.forEach(col => {
      const val = row[col];
      // Robust parsing: handle Hungarian space-separated numbers and commas
      const cleanVal = String(val).replace(/\s+/g, '').replace(',', '.').replace(/[^0-9.-]+/g, '');
      const parsed = parseFloat(cleanVal);
      item[col] = isNaN(parsed) ? 0 : parsed;
    });
    metaCols.forEach(col => {
      item[col] = row[col];
    });
    return item;
  }).slice(0, 500);

  const minifiedJson = JSON.stringify(cleanedData);
  const configJson = JSON.stringify({
    engine,
    valueCols,
    geoCol,
    metaCols,
    ...config
  });

  const width = config.chartWidth || '100%';
  const height = config.chartHeight || '500px';

  // Hidden-but-accessible data table: screen-reader / no-JS fallback (baseline WCAG coverage).
  const a11yHeaderCols = [labelCol || 'Label', ...valueCols, ...metaCols];
  const a11yRows = cleanedData.map(item => {
    const cells = [item.label, ...valueCols.map(c => item[c]), ...metaCols.map(c => item[c])];
    return `<tr>${cells.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`;
  }).join('');
  const a11yTable = `<table class="infog-sr-table"><caption>${escapeHtml(config.title || 'Adatt\u00e1bl\u00e1zat')}</caption><thead><tr>${a11yHeaderCols.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead><tbody>${a11yRows}</tbody></table>`;

  let css = `
  @keyframes spin { to { transform: rotate(360deg); } }
  #${uniqueId} .map-county { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; stroke: #fff; stroke-width: 0.75px; }
  #${uniqueId} .map-county:hover { opacity: 0.9; stroke: #6366f1; stroke-width: 2px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
  .map-tooltip-${uniqueId} {
    position: fixed;
    pointer-events: none;
    background: #0f172a;
    color: white;
    padding: 12px 16px;
    border-radius: 14px;
    font-size: 13px;
    font-weight: 500;
    z-index: 9999;
    display: none;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
    transition: opacity 0.2s;
  }
  .infog-sr-table {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
  }
  `;
  if (config.minifyExport) css = minifyCss(css);

  const headerHtml = (config.title || config.subtitle)
    ? `<div class="dv-header" style="margin-bottom:1.25rem;">
    ${config.title ? `<h3 style="margin:0 0 0.25rem 0; font-size:1.25rem; font-weight:800; color:#0f172a; letter-spacing:-0.01em;">${escapeHtml(config.title)}</h3>` : ''}
    ${config.subtitle ? `<p style="margin:0; font-size:0.875rem; color:#64748b; font-weight:500;">${escapeHtml(config.subtitle)}</p>` : ''}
  </div>`
    : '';
  const footerHtml = config.source
    ? `<div class="dv-footer" style="margin-top:1rem; font-size:0.75rem; color:#94a3b8; font-weight:500;">Forrás: ${escapeHtml(config.source)}</div>`
    : '';

  let html = `
<!-- Data-to-Visual WP Generator Code -->
<div class="data-visual-wrap" role="group" aria-label="${escapeHtml(config.title || 'Interaktív adatvizualizáció')}" style="width:${width}; background:#ffffff; border-radius:2rem; border:1px solid #f1f5f9; box-sizing:border-box; padding:2rem; margin: 2.5rem 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.03);">
  ${headerHtml}
  <div id="${uniqueId}" class="data-visual-container" style="min-height:${height}; position:relative; overflow:hidden;">
    <div class="visual-placeholder" style="text-align:center; padding:2rem; color:#94a3b8; position:absolute; inset:0; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:1rem;">
      <div style="width:40px; height:40px; border:3px solid #f1f5f9; border-top-color:#6366f1; border-radius:50%; animation: spin 0.8s linear infinite;"></div>
      <strong style="font-weight:600; letter-spacing:-0.01em;">Initializing Visualization...</strong>
    </div>
  </div>
  ${a11yTable}
  ${footerHtml}
</div>

<style>
${css}
</style>

<!-- Embedded Dataset -->
<script id="${dataNodeId}" type="application/json">
${minifiedJson}
</script>

<!-- Engine Configuration -->
<script id="config_${uniqueId}" type="application/json">
${configJson}
</script>`;

  if (engine === 'chart') {
    let chartJs = `
  (function() {
${FORMAT_VALUE_JS_SRC}
    const container = document.getElementById('${uniqueId}');
    const canvas = document.createElement('canvas');
    canvas.id = '${uniqueId}_canvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    function renderChart() {
      /* Visual Engine v2.1 - Pill Design */
      try {
        const dataEl = document.getElementById('${dataNodeId}');
        const configEl = document.getElementById('config_${uniqueId}');
        if (!dataEl || !configEl) return;
        
        const data = JSON.parse(dataEl.textContent);
        const cfg = JSON.parse(configEl.textContent);
        
        container.innerHTML = '';
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        
        const labels = data.map(d => d.label);
        
        // Exact Vibrant Palette (Informed by latest dashboard reference)
        const palette = [
          '#06b6d4', // Cyan (Teal-ish)
          '#f97316', // Orange
          '#fb7185', // Rose/Coral
          '#6366f1', // Indigo
          '#14b8a6', // Teal
          '#f59e0b', // Amber
          '#a855f7'  // Purple
        ];
        
        const datasets = cfg.valueCols.map((col, idx) => {
          const baseColor = (cfg.seriesColors && cfg.seriesColors[col]) || palette[idx % palette.length];
          
          // Create Gradient for Line/Area charts
          let backgroundColor = baseColor + '15';
          if (cfg.chartType === 'line') {
             const gradient = ctx.createLinearGradient(0, 0, 0, 400); // Larger gradient range
             gradient.addColorStop(0, baseColor + '45'); // More opaque at top
             gradient.addColorStop(1, baseColor + '00');
             backgroundColor = gradient;
          } else if (cfg.chartType === 'bar') {
             // Subtle vertical gradient for bars too
             const gradient = ctx.createLinearGradient(0, 0, 0, 400);
             gradient.addColorStop(0, baseColor);
             gradient.addColorStop(1, baseColor + 'ee');
             backgroundColor = gradient;
          }

          return {
            label: col,
            data: data.map(d => d[col]),
            backgroundColor: (cfg.chartType === 'pie' || cfg.chartType === 'doughnut') ? palette : backgroundColor,
            borderColor: baseColor,
            borderWidth: 2,
            fill: true,
            tension: 0.45,
            borderRadius: 100, // True pill shape
            borderSkipped: false,
            barThickness: 'flex',
            barPercentage: 0.5, // Slimmer bars like in the reference
            categoryPercentage: 0.8,
            pointBackgroundColor: '#fff',
            pointBorderColor: baseColor,
            pointBorderWidth: 2.5,
            pointRadius: 4.5,
            pointHoverRadius: 7,
            pointStyle: 'circle'
          };
        });

        new Chart(ctx, {
          type: cfg.chartType || 'bar',
          data: { labels, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 30, bottom: 10, left: 15, right: 15 } },
            plugins: { 
              legend: { 
                display: datasets.length > 1 || cfg.chartType === 'pie' || cfg.chartType === 'doughnut',
                position: 'top',
                align: 'end',
                labels: { 
                  usePointStyle: true,
                  pointStyle: 'circle',
                  padding: 25,
                  font: { size: 12, weight: '700', family: "'-apple-system', sans-serif" },
                  color: '#64748b',
                  boxWidth: 7,
                  boxHeight: 7
                }
              },
              tooltip: {
                backgroundColor: '#0f172a',
                padding: 14,
                titleFont: { size: 13, weight: '800' },
                bodyFont: { size: 13 },
                cornerRadius: 15,
                displayColors: true,
                usePointStyle: true,
                boxPadding: 8,
                callbacks: {
                  label: (item) => {
                    const raw = (item.parsed && typeof item.parsed === 'object') ? (item.parsed.y ?? item.parsed.r) : item.parsed;
                    return item.dataset.label + ': ' + formatValue(raw, cfg);
                  },
                  afterBody: (items) => {
                    if (!cfg.metaCols || !cfg.metaCols.length || !items.length) return [];
                    const row = data[items[0].dataIndex];
                    return cfg.metaCols.map(mc => mc + ': ' + row[mc]);
                  }
                }
              }
            },
            scales: cfg.chartType === 'pie' || cfg.chartType === 'doughnut' || cfg.chartType === 'radar' ? {} : {
              y: {
                beginAtZero: true,
                border: { display: false },
                grid: { color: '#f1f5f9' },
                ticks: { color: '#94a3b8', font: { size: 11, weight: '700' }, padding: 12, callback: (v) => formatValue(v, cfg) }
              },
              x: { 
                border: { display: false },
                grid: { display: false },
                ticks: { color: '#94a3b8', font: { size: 11, weight: '700' }, padding: 12 }
              }
            }
          }
        });
        window.__RENDER_READY__ = true;
      } catch (err) {
        console.error('Visual Engine initialization failed:', err);
        container.innerHTML = '<div style="padding:1rem;color:#ef4444;text-align:center;">Visualization error. Please check your data.</div>';
      }
    }

    if (typeof Chart !== 'undefined') {
      renderChart();
    } else {
      const script = document.querySelector('script[src*="chart.js"]');
      if (script) {
        script.addEventListener('load', renderChart);
        setTimeout(() => { if (typeof Chart !== 'undefined' && container.querySelector('.visual-placeholder')) renderChart(); }, 1500);
      }
    }
  })();
`;
    if (config.minifyExport) chartJs = minifyJs(chartJs);
    html += `
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
${chartJs}
</script>`;
  } else if (engine === 'map') {
    const selectedMap = MAP_TEMPLATES[config.mapTemplate] || MAP_TEMPLATES['hu-counties'];
    let mapJs = `
(function() {
${FORMAT_VALUE_JS_SRC}
  const container = document.getElementById('${uniqueId}');
  const data = ${minifiedJson};
  const cfg = ${configJson};

  function interpolateColor(color1, color2, factor) {
    const r1 = parseInt(color1.substring(1,3), 16);
    const g1 = parseInt(color1.substring(3,5), 16);
    const b1 = parseInt(color1.substring(5,7), 16);
    const r2 = parseInt(color2.substring(1,3), 16);
    const g2 = parseInt(color2.substring(3,5), 16);
    const b2 = parseInt(color2.substring(5,7), 16);
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function initMap() {
    try {
      const valueCol = cfg.heatValueCol || cfg.valueCols[0];
      if (!valueCol) {
        container.innerHTML = '<div style="padding:1rem;color:#64748b;text-align:center;">No data column selected for heatmap.</div>';
        return;
      }
      
      const values = data.map(d => d[valueCol]).filter(v => typeof v === 'number');
      const minVal = values.length ? Math.min(...values) : 0;
      const maxVal = values.length ? Math.max(...values) : 100;
      const range = maxVal - minVal;

      // Build legend
      const legend = document.createElement('div');
      legend.style.cssText = 'position:absolute; bottom:2rem; right:2rem; background:rgba(255,255,255,0.95); padding:1rem; border-radius:1.25rem; font-size:0.75rem; border:1px solid #f1f5f9; z-index:100; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); backdrop-filter:blur(8px);';
      legend.innerHTML = '<div style="font-weight:800; margin-bottom:0.75rem; color:#475569; text-transform:uppercase; letter-spacing:0.05em; display:flex; align-items:center; gap:0.5rem;"><div style="width:8px; height:8px; border-radius:50%; background:#6366f1;"></div>' + (cfg.legendLabel || valueCol) + '</div>' +
        '<div style="display:flex; align-items:center; gap:1rem;">' +
          '<span style="color:#94a3b8; font-weight:700;">' + formatValue(minVal, cfg) + '</span>' +
          '<div style="width:120px; height:6px; border-radius:10px; background:linear-gradient(to right, ' + (cfg.heatMin || '#f1f5f9') + ', ' + (cfg.heatMax || '#6366f1') + ');"></div>' +
          '<span style="color:#94a3b8; font-weight:700;">' + formatValue(maxVal, cfg) + '</span>' +
        '</div>';

      const tooltip = document.createElement('div');
      tooltip.className = 'map-tooltip-${uniqueId}';
      document.body.appendChild(tooltip);

      // Create SVG (only the selected template's region data is embedded, not every map)
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const regions = ${JSON.stringify(selectedMap.regions)};
      const viewBox = ${JSON.stringify(selectedMap.viewBox)};

      svg.setAttribute('viewBox', viewBox);
      const regionOwnNames = {};
      regions.forEach(reg => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute('d', reg.path);
        path.setAttribute('id', reg.id);
        const safeId = reg.id.toLowerCase();
        const safeParentId = (reg.parentId || reg.id).toLowerCase();
        path.setAttribute('class', 'map-county map-region-' + safeId + ' map-parent-' + safeParentId);
        path.setAttribute('fill', '#f8fafc');
        regionOwnNames[safeId] = reg.name;
        svg.appendChild(path);
      });

      container.innerHTML = '';
      container.appendChild(svg);
      container.appendChild(legend);

      // Slightly expand every region from its own visual center. This is a standard fix for
      // hairline "sliver" gaps between independently-digitized neighboring borders (common with
      // simplified/generalized boundary data) — imperceptible for each shape's own outline, but
      // enough to close small seams instead of showing background through them.
      svg.querySelectorAll('path').forEach(p => {
        try {
          const b = p.getBBox();
          const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
          p.setAttribute('transform', 'translate(' + cx + ',' + cy + ') scale(1.01) translate(' + (-cx) + ',' + (-cy) + ')');
        } catch (err) {}
      });

      // Group data rows by normalized geoId so every region can show a tooltip, whether or
      // not it has matching data.
      const byGeoId = {};
      data.forEach(item => {
        if (!item.geoId) return;
        const key = String(item.geoId).toLowerCase();
        (byGeoId[key] = byGeoId[key] || []).push(item);
      });

      svg.querySelectorAll('path').forEach(p => {
        const safeParentId = (p.getAttribute('class').match(/map-parent-(\\S+)/) || [])[1] || '';
        const items = byGeoId[safeParentId] || [];
        const name = regionOwnNames[p.id] || p.id;
        let color = null;

        if (items.length) {
          const val = items[0][valueCol];
          const factor = range <= 0 ? 0.5 : (val - minVal) / range;
          color = interpolateColor(cfg.heatMin || '#f1f5f9', cfg.heatMax || '#6366f1', factor);
          p.setAttribute('fill', color);
        }

        p.addEventListener('mouseenter', () => {
          tooltip.style.display = 'block';
          tooltip.style.opacity = '1';
          const dot = '<div style="width:8px; height:8px; border-radius:50%; background:' + (color || '#cbd5e1') + ';"></div>';
          if (items.length) {
            const item = items[0];
            const val = item[valueCol];
            const metaHtml = (cfg.metaCols || []).map(mc => '<div style="font-size:11px; color:#94a3b8; margin-top:4px;">' + mc + ': ' + item[mc] + '</div>').join('');
            tooltip.innerHTML = '<div style="font-size:11px; color:#94a3b8; font-weight:800; margin-bottom:5px; text-transform:uppercase; display:flex; align-items:center; gap:6px;">' + dot + item.label + '</div>' +
                               '<div style="font-size:18px; font-weight:900; letter-spacing:-0.02em;">' + formatValue(val, cfg) + '</div>' + metaHtml;
          } else {
            tooltip.innerHTML = '<div style="font-size:11px; color:#94a3b8; font-weight:800; margin-bottom:5px; text-transform:uppercase; display:flex; align-items:center; gap:6px;">' + dot + name + '</div>' +
                               '<div style="font-size:13px; font-weight:700; color:#94a3b8;">Nincs adat</div>';
          }
        });
        p.addEventListener('mousemove', (e) => {
          const rect = container.getBoundingClientRect();
          const margin = 8;
          const tw = tooltip.offsetWidth;
          const th = tooltip.offsetHeight;

          let left = e.clientX - tw / 2;
          const minLeft = rect.left + margin;
          const maxLeft = rect.right - tw - margin;
          if (left < minLeft) left = minLeft;
          if (left > maxLeft) left = maxLeft;

          let top = e.clientY - th - 16;
          if (top < rect.top + margin) top = e.clientY + 16;

          tooltip.style.left = left + 'px';
          tooltip.style.top = top + 'px';
        });
        p.addEventListener('mouseleave', () => {
          tooltip.style.opacity = '0';
          setTimeout(() => { if(tooltip.style.opacity === '0') tooltip.style.display = 'none'; }, 200);
        });
      });
      window.__RENDER_READY__ = true;
    } catch (err) {
      console.error('Map initialization error:', err);
      container.innerHTML = '<div style="padding:1rem;color:#ef4444;text-align:center;font-weight:bold;">Map generation error.</div>';
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initMap();
  } else {
    document.addEventListener('DOMContentLoaded', initMap);
  }
})();
`;
    if (config.minifyExport) mapJs = minifyJs(mapJs);
    html += `
<script>
${mapJs}
</script>`;
  }

  return html.trim();
}
