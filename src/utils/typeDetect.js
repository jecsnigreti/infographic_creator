import { HUNGARY_COUNTIES } from './maps/hungary-counties.js';

const HU_COUNTY_NAMES = new Set(
  HUNGARY_COUNTIES.map(c => c.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))
);

function normalize(v) {
  return String(v ?? '').trim();
}

function isNumberLike(v) {
  const s = normalize(v).replace(/%$/, '').replace(/\s+/g, '').replace(',', '.');
  if (s === '') return false;
  return !isNaN(parseFloat(s)) && isFinite(s);
}

function isPercentLike(v) {
  return /%\s*$/.test(normalize(v)) && isNumberLike(v);
}

function isDateLike(v) {
  const s = normalize(v);
  if (!s) return false;
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) return true;
  if (/^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/.test(s)) return true;
  if (/^\d{4}\.\s*(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)/i.test(s)) return true;
  return false;
}

function isGeoLike(v) {
  const s = normalize(v);
  if (!s) return false;
  if (/^[A-Za-z]{2}$/.test(s)) return true; // ISO-3166-1 alpha-2 style code
  const bare = s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return HU_COUNTY_NAMES.has(bare);
}

/**
 * Infers a semantic type for a column by sampling its values.
 * Returns one of: 'number', 'percent', 'date', 'geo', 'text'.
 */
export function detectColumnType(values) {
  const sample = values.filter(v => normalize(v) !== '').slice(0, 200);
  if (!sample.length) return 'text';

  const total = sample.length;
  const percentCount = sample.filter(isPercentLike).length;
  const numberCount = sample.filter(isNumberLike).length;
  const dateCount = sample.filter(isDateLike).length;
  const geoCount = sample.filter(isGeoLike).length;

  if (percentCount / total >= 0.8) return 'percent';
  if (numberCount / total >= 0.8) return 'number';
  if (dateCount / total >= 0.6) return 'date';
  if (geoCount / total >= 0.5) return 'geo';
  return 'text';
}

/**
 * Detects a type per column and suggests an initial data-role mapping:
 * label -> first text/geo column, value -> first number/percent column, geoId -> first geo column.
 */
export function suggestMapping(columns, data) {
  const types = {};
  columns.forEach(col => {
    types[col] = detectColumnType(data.map(row => row[col]));
  });

  const mapping = {};
  columns.forEach(col => { mapping[col] = []; });

  const geoCol = columns.find(col => types[col] === 'geo');
  const labelCol = geoCol || columns.find(col => types[col] === 'text');
  const valueCol = columns.find(col => types[col] === 'number' || types[col] === 'percent');

  if (labelCol) mapping[labelCol].push('label');
  if (geoCol) mapping[geoCol].push('geoId');
  if (valueCol) mapping[valueCol].push('value');

  return { types, mapping };
}
