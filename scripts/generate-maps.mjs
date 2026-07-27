// Dev-only tooling: regenerates the World/Africa/EU/Middle-East/USA map data files from
// real, public geographic boundaries (Natural Earth via `world-atlas`, US Census via
// `us-atlas`), instead of the hand-drawn placeholder rectangles (or, for the old USA
// file, corrupted hand-authored path data) they used to contain.
//
// Run with: node scripts/generate-maps.mjs
//
// Output files keep the exact same shape the app already consumes:
//   export const NAME = [ { id: "XX", name: "Country", path: "M..." }, ... ];
// so no changes are needed in exporter.js or VisualConfigSidebar.vue beyond the map list itself.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { feature } from 'topojson-client';
import { geoPath, geoEqualEarth, geoMercator, geoAlbersUsa } from 'd3-geo';
import iso from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json' with { type: 'json' };

iso.registerLocale(en);

const __dirname = dirname(fileURLToPath(import.meta.url));
const mapsDir = join(__dirname, '..', 'src', 'utils', 'maps');

function loadCountries(resolution) {
  const topology = JSON.parse(
    readFileSync(join(__dirname, '..', 'node_modules', 'world-atlas', `countries-${resolution}.json`), 'utf8')
  );
  const world = feature(topology, topology.objects.countries);
  // Resolve each feature to its ISO 3166-1 alpha-2 code (the `id` contract the app matches
  // user geo-data against).
  return world.features
    .map(f => ({ f, alpha2: iso.numericToAlpha2(f.id) }))
    .filter(x => !!x.alpha2);
}

// 110m: small enough for a whole-world embed, but omits several small nations entirely
// (Malta, Bahrain, Seychelles, ...) rather than just simplifying their shape — invisible
// at world scale anyway, so that's the right tradeoff for the World template.
const countries110 = loadCountries('110m');
// 50m: the lowest tier with full country coverage — used for the regional templates
// (EU/Africa/Middle East) where a missing small member state would be obviously wrong.
const countries50 = loadCountries('50m');

function buildRegion({ codes, width, height, projectionFactory, source }) {
  const withAlpha2 = source === '110m' ? countries110 : countries50;
  const included = codes
    ? withAlpha2.filter(x => codes.includes(x.alpha2))
    : withAlpha2;
  const fc = { type: 'FeatureCollection', features: included.map(x => x.f) };

  const projection = projectionFactory().fitSize([width, height], fc);
  // 1 fractional digit is plenty at typical embed display sizes and roughly halves output size.
  const pathGen = geoPath(projection).digits(1);

  return included
    .map(({ f, alpha2 }) => ({
      id: alpha2,
      name: f.properties.name,
      path: pathGen(f)
    }))
    .filter(r => !!r.path);
}

// US Census FIPS state code -> USPS postal code (the `id` contract for this template).
const FIPS_TO_USPS = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC',
  '12':'FL','13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY',
  '22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT',
  '31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH',
  '40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD','47':'TN','48':'TX','49':'UT',
  '50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY'
};

function buildUsaStates({ width, height }) {
  const topology = JSON.parse(
    readFileSync(join(__dirname, '..', 'node_modules', 'us-atlas', 'states-10m.json'), 'utf8')
  );
  const states = feature(topology, topology.objects.states);
  const included = states.features
    .map(f => ({ f, usps: FIPS_TO_USPS[f.id] }))
    .filter(x => !!x.usps);
  const fc = { type: 'FeatureCollection', features: included.map(x => x.f) };

  // geoAlbersUsa is purpose-built for this: it automatically repositions Alaska and
  // Hawaii into insets next to the mainland instead of their real (far-away) coordinates.
  const projection = geoAlbersUsa().fitSize([width, height], fc);
  const pathGen = geoPath(projection).digits(1);

  return included.map(({ f, usps }) => ({
    id: usps,
    name: f.properties.name,
    path: pathGen(f)
  }));
}

const EU = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];

const AFRICA = ['DZ','AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CG','CD','CI','DJ','EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW'];

const MIDDLE_EAST = ['BH','EG','IR','IQ','IL','JO','KW','LB','OM','PS','QA','SA','SY','TR','AE','YE'];

const regions = [
  {
    file: 'world-countries.js',
    exportName: 'WORLD_COUNTRIES',
    codes: null,
    width: 1000, height: 600,
    projectionFactory: geoEqualEarth,
    source: '110m'
  },
  {
    file: 'africa-countries.js',
    exportName: 'AFRICA_COUNTRIES',
    codes: AFRICA,
    width: 1000, height: 800,
    projectionFactory: geoMercator,
    source: '50m'
  },
  {
    file: 'eu-members.js',
    exportName: 'EU_MEMBERS',
    codes: EU,
    width: 1050, height: 900,
    projectionFactory: geoMercator,
    source: '50m'
  },
  {
    file: 'middle-east.js',
    exportName: 'MIDDLE_EAST',
    codes: MIDDLE_EAST,
    width: 1000, height: 800,
    projectionFactory: geoMercator,
    source: '50m'
  }
];

function writeRegionFile(file, exportName, data) {
  const body = data
    .map(r => `  { id: ${JSON.stringify(r.id)}, name: ${JSON.stringify(r.name)}, path: ${JSON.stringify(r.path)} }`)
    .join(',\n');
  const source = `export const ${exportName} = [\n${body}\n];\n`;
  writeFileSync(join(mapsDir, file), source, 'utf8');
  console.log(`${file}: ${data.length} regions written`);
}

for (const region of regions) {
  writeRegionFile(region.file, region.exportName, buildRegion(region));
}

writeRegionFile('usa-high-res.js', 'USA_STATES_HIGH_RES', buildUsaStates({ width: 1000, height: 600 }));

// --- Australia states/territories (real lon/lat boundaries via `world-geojson`) ---
//
// The previous australia-states.js was synthetic/hallucinated data (self-intersecting
// paths, implausible bounding boxes all crammed into the same narrow x-range regardless
// of the state) rather than real geometry, which is why it visually "fell apart".
//
// Each state file in world-geojson ships every offshore island as its own polygon
// (Queensland alone has 152 — mostly tiny Great Barrier Reef specks), so we keep only
// polygons whose area is at least 0.3% of that state's largest polygon (the mainland).
// That keeps genuinely notable islands (Tasmania's King/Flinders Island, South Australia's
// Kangaroo Island, the Northern Territory's Melville Island) while dropping reef noise.
//
// ACT (Australian Capital Territory) isn't in this data source; it's a tiny enclave
// within NSW, so — same tradeoff as Budapest-in-Pest, but without a reliable boundary to
// draw here — it's folded into NSW instead of shipping a fake shape for it.
function ringArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return Math.abs(a / 2);
}

function buildAustraliaStates(width, height) {
  const AU_STATES = [
    { fileName: 'new_south_wales', id: 'AU-NSW', name: 'New South Wales' },
    { fileName: 'victoria', id: 'AU-VIC', name: 'Victoria' },
    { fileName: 'queensland', id: 'AU-QLD', name: 'Queensland' },
    { fileName: 'western_australia', id: 'AU-WA', name: 'Western Australia' },
    { fileName: 'south_australia', id: 'AU-SA', name: 'South Australia' },
    { fileName: 'tasmania', id: 'AU-TAS', name: 'Tasmania' },
    { fileName: 'northern_territory', id: 'AU-NT', name: 'Northern Territory' }
  ];

  const stateFeatures = AU_STATES.map(s => {
    const source = JSON.parse(
      readFileSync(join(__dirname, '..', 'node_modules', 'world-geojson', 'states', 'australia', `${s.fileName}.json`), 'utf8')
    );
    const areas = source.features.map(f => ringArea(f.geometry.coordinates[0]));
    const maxArea = Math.max(...areas);
    const kept = source.features.filter((f, i) => areas[i] >= maxArea * 0.003);
    // world-geojson's rings wind the "wrong" way for d3-geo's planar clipping: fed as-is,
    // every state's fitSize/bounds collapses to the full combined extent (each polygon gets
    // misread as "contains the whole clip rectangle"), which is why the map fell apart —
    // every state rendered squeezed into the same tiny corner instead of its real position.
    const coords = kept.map(f => f.geometry.coordinates.map(ring => ring.slice().reverse()));
    const feature = { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: coords } };
    return { ...s, feature };
  });

  const fc = { type: 'FeatureCollection', features: stateFeatures.map(s => s.feature) };
  const projection = geoMercator().fitSize([width, height], fc);
  const pathGen = geoPath(projection).digits(1);

  return stateFeatures.map(s => ({ id: s.id, name: s.name, path: pathGen(s.feature) }));
}

writeRegionFile('australia-states.js', 'AUSTRALIA_STATES', buildAustraliaStates(1000, 900));

// --- Per-country European region maps (NUTS boundaries, Eurostat/GISCO) ---
//
// Source: https://gisco-services.ec.europa.eu/distribution/v2/nuts/ (2024 edition, 1:3M —
// the 1:20M tier used originally was noticeably blocky/over-simplified for a single-country
// map, e.g. the Netherlands' provinces looked crude; 1:3M gives ~5-6x more boundary detail
// per country while staying small since we only keep one country's regions afterward).
// © EuroGeographics for the administrative boundaries — free reuse with attribution
// under Eurostat/GISCO's terms (https://ec.europa.eu/eurostat/web/gisco/geodata/statistical-units/territorial-units-statistics).
//
// NUTS level is chosen per country to match what people actually recognize as "the regions
// of that country" — e.g. Germany's 16 Bundesländer are NUTS-1, but Italy's NUTS-1 is just
// 5 coarse macro-groupings nobody uses, so Italy uses NUTS-2 (its 21 regioni) instead.
function slugify(name) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '-');
}

async function fetchNutsLevel(level) {
  const url = `https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_03M_2024_4326_LEVL_${level}.geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch NUTS level ${level}: ${res.status}`);
  return res.json();
}

function buildCountryRegions(nutsGeojson, countryCode, width, height, excludeIds = []) {
  const features = nutsGeojson.features.filter(f =>
    f.properties.CNTR_CODE === countryCode && !excludeIds.includes(f.properties.NUTS_ID)
  );
  const fc = { type: 'FeatureCollection', features };
  const projection = geoMercator().fitSize([width, height], fc);
  const pathGen = geoPath(projection).digits(1);

  return features.map(f => {
    const name = f.properties.NAME_LATN;
    return { id: slugify(name), name, path: pathGen(f) };
  });
}

const COUNTRY_MAPS = [
  { file: 'germany-states.js', exportName: 'GERMANY_STATES', code: 'DE', level: 1 },
  // FRY = "Régions Ultrapériphériques" — a single combined feature covering France's
  // scattered overseas territories (Réunion, Martinique, Guyane, ...). Including it in
  // fitSize would zoom the whole map out to fit the Caribbean/Indian Ocean, shrinking
  // mainland France (what people actually mean by "the map of France") to a speck.
  { file: 'france-regions.js', exportName: 'FRANCE_REGIONS', code: 'FR', level: 1, excludeIds: ['FRY'] },
  { file: 'italy-regions.js', exportName: 'ITALY_REGIONS', code: 'IT', level: 2 },
  { file: 'spain-regions.js', exportName: 'SPAIN_REGIONS', code: 'ES', level: 2 },
  { file: 'poland-voivodeships.js', exportName: 'POLAND_VOIVODESHIPS', code: 'PL', level: 2 },
  { file: 'romania-regions.js', exportName: 'ROMANIA_REGIONS', code: 'RO', level: 2 },
  { file: 'netherlands-provinces.js', exportName: 'NETHERLANDS_PROVINCES', code: 'NL', level: 2 },
  { file: 'austria-states.js', exportName: 'AUSTRIA_STATES', code: 'AT', level: 2 }
];

const nutsByLevel = {};
for (const level of [...new Set(COUNTRY_MAPS.map(c => c.level))]) {
  nutsByLevel[level] = await fetchNutsLevel(level);
}

for (const country of COUNTRY_MAPS) {
  const data = buildCountryRegions(nutsByLevel[country.level], country.code, 1000, 900, country.excludeIds);
  writeRegionFile(country.file, country.exportName, data);
}
