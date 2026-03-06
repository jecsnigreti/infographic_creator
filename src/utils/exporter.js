import { HUNGARY_COUNTIES } from './maps/hungary-counties.js';

export function generateWPCode(hotspots, config, baseImage) {
  const id = `infog-${Math.random().toString(36).substr(2, 9)}`;

  const hotspotsHTML = hotspots.map(h => {
    const bubbleColor = h.color || config.themeColor;
    const iconSVG = {
      plus: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" /></svg>',
      info: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
      question: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
      star: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>',
      exclamation: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>'
    }[h.icon || 'plus'];

    return `
    <div class="infog-hotspot" style="left: ${h.x}%; top: ${h.y}%;" data-id="${h.id}">
      <div class="infog-dot" style="background-color: ${bubbleColor}; border-color: white;">
        ${iconSVG}
        <div class="infog-pulse" style="background-color: ${bubbleColor};"></div>
      </div>
      <div class="infog-popup">
        ${h.mediaUrl ? `<img src="${h.mediaUrl}" class="infog-media" alt="${h.title}">` : ''}
        <div class="infog-popup-content">
          <h3>${h.title}</h3>
          <div class="infog-body">${h.content}</div>
          ${h.link ? `<a href="${h.link}" target="_blank" class="infog-cta" style="background: ${bubbleColor}">${h.cta || 'Learn More'}</a>` : ''}
        </div>
        <div class="infog-popup-arrow"></div>
      </div>
    </div>
  `}).join('');

  const css = `
    #${id} {
      position: relative;
      width: 100%;
      margin: 20px 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow: hidden;
      border-radius: 12px;
    }
    #${id} img.infog-base {
      display: block;
      width: 100%;
      height: auto;
    }
    #${id} .infog-hotspot {
      position: absolute;
      transform: translate(-50%, -50%);
      cursor: pointer;
      z-index: 10;
    }
    #${id} .infog-dot {
      width: 24px;
      height: 24px;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      position: relative;
    }
    #${id} .infog-hotspot:hover .infog-dot {
      transform: scale(1.15) rotate(5deg);
    }
    ${config.pulseAnimation ? `
    #${id} .infog-pulse {
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      opacity: 0.6;
      animation: infog-pulse 2s infinite;
      z-index: -1;
    }
    @keyframes infog-pulse {
      0% { transform: scale(1); opacity: 0.6; }
      100% { transform: scale(3); opacity: 0; }
    }
    ` : ''}
    #${id} .infog-popup {
      position: absolute;
      bottom: 100%;
      left: 50%;
      width: 280px;
      background: white;
      color: #1e293b;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,0.15);
      opacity: 0;
      visibility: hidden;
      z-index: 20;
      transition: opacity 0.4s, visibility 0.4s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(0,0,0,0.05);
      transform: translate(-50%, -15px) scale(0.95);
    }
    #${id} .infog-hotspot.active .infog-popup,
    #${id} .infog-hotspot:hover .infog-popup {
      opacity: 1;
      visibility: visible;
      transform: translate(-50%, -25px) scale(1);
    }
    
    /* Smart Positioning (Flipped) */
    #${id} .infog-hotspot.flipped .infog-popup {
      bottom: auto;
      top: 100%;
      transform: translate(-50%, 15px) scale(0.95);
    }
    #${id} .infog-hotspot.flipped.active .infog-popup,
    #${id} .infog-hotspot.flipped:hover .infog-popup {
      transform: translate(-50%, 25px) scale(1);
    }
    #${id} .infog-hotspot.flipped .infog-popup-arrow {
      top: auto;
      bottom: 100%;
      border-top-color: transparent;
      border-bottom-color: white;
    }

    #${id} .infog-media {
      width: 100%;
      height: 160px;
      object-fit: cover;
      display: block;
    }
    #${id} .infog-popup-content {
      padding: 20px;
    }
    #${id} .infog-popup-arrow {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 10px solid transparent;
      border-top-color: white;
    }
    #${id} h3 { margin: 0 0 10px 0; font-size: 18px; font-weight: 800; color: #0f172a; tracking: -0.02em; }
    #${id} .infog-body { margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #64748b; font-weight: 500; }
    #${id} .infog-cta {
      display: inline-block;
      padding: 10px 20px;
      color: white !important;
      text-decoration: none !important;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      tracking: 0.1em;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: all 0.2s;
    }
    #${id} .infog-cta:hover {
      transform: translateY(-2px);
      filter: brightness(1.1);
      box-shadow: 0 6px 15px rgba(0,0,0,0.15);
    }
  `;

  const js = `
    (function() {
      const container = document.getElementById('${id}');
      const hotspots = container.querySelectorAll('.infog-hotspot');
      
      const updatePosition = (h) => {
        const popup = h.querySelector('.infog-popup');
        const rect = popup.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Vertical Flipping
        if (rect.top < containerRect.top) {
          h.classList.add('flipped');
        } else if (rect.bottom > containerRect.bottom && h.classList.contains('flipped')) {
          // Check if we should flip back if it was flipped but now overflows bottom
          // Simple logic: if it fits top, show top.
        }
      };

      hotspots.forEach(h => {
        // Initialize position check on hover or click
        h.addEventListener('mouseenter', () => updatePosition(h));
        
        h.addEventListener('click', (e) => {
          e.stopPropagation();
          const isActive = h.classList.contains('active');
          hotspots.forEach(opt => opt.classList.remove('active'));
          if (!isActive) {
            h.classList.add('active');
            updatePosition(h);
          }
        });
      });

      document.addEventListener('click', () => {
        hotspots.forEach(opt => opt.classList.remove('active'));
      });
    })();
  `;

  let finalCss = css;
  let finalJs = js;

  if (config.minifyExport) {
    finalCss = finalCss.replace(/\s+/g, ' ').replace(/\/\*.*?\*\//g, '').replace(/ {\s+/g, '{').replace(/:\s+/g, ':').replace(/;\s+/g, ';').replace(/;}/g, '}').trim();
    finalJs = finalJs.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*?\n/g, '').replace(/\s+/g, ' ').replace(/ {\s+/g, '{').replace(/;\s+/g, ';').replace(/}\s+/g, '}').trim();
  }

  return `
<!-- Interactive Infographic Generated by Antigravity -->
<div id="${id}">
  <img src="${baseImage}" class="infog-base" alt="Infographic">
  ${hotspotsHTML}
</div>

<style>
${finalCss}
</style>

<script>
${finalJs}
</script>
  `.trim();
}

export function generateDataVisualCode(database, mapping, engine, config) {
  const uniqueId = `div_${Math.random().toString(36).substring(2, 9)}`;
  const dataNodeId = `data_${Math.random().toString(36).substring(2, 9)}`;

  // Filter labels and multiple values
  const labelCol = Object.keys(mapping).find(k => (mapping[k] || []).includes('label'));
  const valueCols = Object.keys(mapping).filter(k => (mapping[k] || []).includes('value'));
  const geoCol = Object.keys(mapping).find(k => (mapping[k] || []).includes('geoId'));

  const cleanedData = database.data.map(row => {
    const item = {
      label: labelCol ? row[labelCol] : 'Unknown',
      geoId: geoCol ? String(row[geoCol]).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-') : null
    };
    valueCols.forEach(col => {
      const val = row[col];
      // Robust parsing: handle Hungarian space-separated numbers and commas
      const cleanVal = String(val).replace(/\s+/g, '').replace(',', '.').replace(/[^0-9.-]+/g, '');
      const parsed = parseFloat(cleanVal);
      item[col] = isNaN(parsed) ? 0 : parsed;
    });
    return item;
  }).slice(0, 500);

  const minifiedJson = JSON.stringify(cleanedData);
  const configJson = JSON.stringify({
    engine,
    valueCols,
    geoCol,
    ...config
  });

  const width = config.chartWidth || '100%';
  const height = config.chartHeight || '500px';

  let html = `
<!-- Data-to-Visual WP Generator Code -->
<div id="${uniqueId}" class="data-visual-container" style="width:${width}; min-height:${height}; background:#fff; border-radius:1.5rem; border:1px solid #e2e8f0; position:relative; overflow:hidden; padding:1.5rem; box-sizing:border-box; margin: 2rem 0; font-family: sans-serif;">
  <div class="visual-placeholder" style="text-align:center; padding:2rem; color:#64748b; position:absolute; inset:0; display:flex; items-center; justify-content:center;">
    <strong>Initializing Visual Engine...</strong>
  </div>
</div>

<style>
  #${uniqueId} .map-county { transition: fill 0.3s, opacity 0.3s; cursor: pointer; stroke: #fff; stroke-width: 0.5px; }
  #${uniqueId} .map-county:hover { opacity: 0.8; stroke: #334155; stroke-width: 1.5px; }
  #${uniqueId} .map-tooltip {
    position: fixed;
    pointer-events: none;
    background: rgba(15, 23, 42, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: bold;
    z-index: 9999;
    display: none;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
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
    html += `
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
  (function() {
    const container = document.getElementById('${uniqueId}');
    const canvas = document.createElement('canvas');
    canvas.id = '${uniqueId}_canvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    function renderChart() {
      try {
        const dataEl = document.getElementById('${dataNodeId}');
        const configEl = document.getElementById('config_${uniqueId}');
        if (!dataEl || !configEl) {
          console.error('Visual Engine error: Missing data or config');
          return;
        }
        const data = JSON.parse(dataEl.textContent);
        const cfg = JSON.parse(configEl.textContent);
        
        container.innerHTML = '';
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        
        const labels = data.map(d => d.label);
        const datasets = cfg.valueCols.map((col, idx) => {
          const color = (cfg.seriesColors && cfg.seriesColors[col]) || '#4f46e5';
          return {
            label: col,
            data: data.map(d => d[col]),
            backgroundColor: color + (cfg.chartType === 'pie' ? '' : '33'),
            borderColor: color,
            borderWidth: cfg.chartType === 'line' ? 3 : 1,
            fill: cfg.chartType === 'line' ? false : true,
            tension: 0.4
          };
        });

        new Chart(ctx, {
          type: cfg.chartType || 'bar',
          data: { labels, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
              legend: { 
                display: datasets.length > 1,
                position: 'top',
                labels: { font: { weight: 'bold', family: 'sans-serif' } }
              }
            },
            scales: cfg.chartType === 'pie' || cfg.chartType === 'radar' ? {} : {
              y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
              x: { grid: { display: false } }
            }
          }
        });
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
        // Fallback for cached scripts
        setTimeout(() => { if (typeof Chart !== 'undefined' && container.querySelector('.visual-placeholder')) renderChart(); }, 1500);
      }
    }
  })();
</script>`;
  } else if (engine === 'map') {
    html += `
<script>
(function() {
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
      legend.style.cssText = 'position:absolute; bottom:1rem; right:1rem; background:rgba(255,255,255,0.8); padding:0.5rem; border-radius:0.5rem; font-size:0.75rem; border:1px solid #e2e8f0; z-index:100;';
      legend.innerHTML = '<div style="font-weight:bold; margin-bottom:0.25rem;">' + valueCol + '</div>' +
        '<div style="display:flex; align-items:center; gap:0.5rem;">' +
          '<span>' + minVal + '</span>' +
          '<div style="width:60px; height:10px; background:linear-gradient(to right, ' + (cfg.heatMin || '#e2e8f0') + ', ' + (cfg.heatMax || '#4f46e5') + ');"></div>' +
          '<span>' + maxVal + '</span>' +
        '</div>';

      const tooltip = document.createElement('div');
      tooltip.className = 'map-tooltip';
      document.body.appendChild(tooltip);

      // Create SVG
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute('viewBox', '0 0 1000 600');
      svg.setAttribute('width', '1000');
      svg.setAttribute('height', '600');
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.display = 'block';

      const regions = ${JSON.stringify(HUNGARY_COUNTIES)};
      regions.forEach(reg => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute('d', reg.path);
        path.setAttribute('id', reg.id);
        path.setAttribute('class', 'map-county map-region-' + reg.id + ' map-parent-' + (reg.parentId || reg.id));
        path.setAttribute('fill', '#f1f5f9');
        svg.appendChild(path);
      });

      container.innerHTML = '';
      container.appendChild(svg);
      container.appendChild(legend);

      console.log('Map Engine: Data items to process:', data.length);
      let coloredCount = 0;

      data.forEach(item => {
        if (!item.geoId) return;
        const paths = svg.querySelectorAll('.map-parent-' + item.geoId);
        if (paths.length) {
          const val = item[valueCol];
          const factor = range <= 0 ? 0.5 : (val - minVal) / range;
          const color = interpolateColor(cfg.heatMin || '#e2e8f0', cfg.heatMax || '#4f46e5', factor);
          
          coloredCount++;
          paths.forEach(p => {
            p.setAttribute('fill', color);
            p.addEventListener('mouseenter', (e) => {
              tooltip.style.display = 'block';
              tooltip.innerHTML = '<strong>' + item.label + '</strong><br>' + valueCol + ': ' + val;
            });
            p.addEventListener('mousemove', (e) => {
              tooltip.style.left = (e.clientX + 10) + 'px';
              tooltip.style.top = (e.clientY - 40) + 'px';
            });
            p.addEventListener('mouseleave', () => {
              tooltip.style.display = 'none';
            });
          });
        }
      });
      console.log('Map Engine: Regions colored:', coloredCount);
    } catch (err) {
      console.error('Map initialization error:', err);
      container.innerHTML = '<div style="padding:1rem;color:#ef4444;text-align:center;">Map generation error. Please check your data.</div>';
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initMap();
  } else {
    document.addEventListener('DOMContentLoaded', initMap);
  }
})();
</script>
`;
  }

  html += '</div>';
  return html.trim();
}
