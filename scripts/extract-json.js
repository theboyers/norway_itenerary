#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

const targetFiles = args.length > 0
  ? args
  : fs.readdirSync(repoRoot)
      .filter(f => /^itinerary\d+\.html$/.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

// Fallback output names if a page does not declare its own export filename.
const FALLBACK_OUTPUT = {
  'itinerary1.html': 'norway-route1-northern-loop',
  'itinerary2.html': 'norway-route2-southern-loop',
  'itinerary3.html': 'norway-route3-geiranger-northwest',
  'itinerary4.html': 'norway-route4-telemark-hardanger',
  'itinerary5.html': 'norway-route5-lofoten-fjords',
  'itinerary6.html': 'norway-route6-south-coast-explorer'
};

// Extract the "const data = [...]" array literal using bracket matching.
// String literals, template literals, and comments are skipped so brackets
// inside them do not confuse the matcher.
function extractDataArray(html) {
  const marker = 'const data = [';
  const mIdx = html.indexOf(marker);
  if (mIdx === -1) return null;
  const open = html.indexOf('[', mIdx + 'const data = '.length);
  if (open === -1) return null;

  let depth = 0;
  let inString = false;
  let stringChar = '';
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escape = false;

  for (let i = open; i < html.length; i++) {
    const ch = html[i];
    const next = html[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') { inBlockComment = false; i++; }
      continue;
    }
    if (inString) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === stringChar) inString = false;
      continue;
    }
    if (inTemplate) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '`') inTemplate = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inString = true; stringChar = ch; continue; }
    if (ch === '`') { inTemplate = true; continue; }
    if (ch === '/' && next === '/') { inLineComment = true; i++; continue; }
    if (ch === '/' && next === '*') { inBlockComment = true; i++; continue; }
    if (ch === '[') {
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0) return html.slice(open, i + 1);
    }
  }
  return null;
}

function evalData(arrayText) {
  return new Function('return (' + arrayText + ');')();
}

// Mirror exportJSON(): convert Date values to YYYY-MM-DD strings.
function toCleanData(data) {
  return data.map(function (d) {
    const o = {};
    for (const k in d) {
      if (k === 'date') {
        o[k] = d.date instanceof Date ? d.date.toISOString().split('T')[0] : d.date;
      } else {
        o[k] = d[k];
      }
    }
    return o;
  });
}

// Mirror exportCSV(): 16 columns, fully quoted, UTF-8 BOM, CRLF rows.
function toCSV(data) {
  const headers = ['Day', 'Date', 'Base', 'Drive', 'Drive Time', 'Directions', 'Breakfast', 'Lunch', 'Dinner', 'Stops', 'Activities', 'Group Notes', 'Lodging', 'Latitude', 'Longitude', 'Points of Interest'];
  const esc = function (v) {
    const s = String(v == null ? '' : v).replace(/"/g, '""');
    return '"' + s + '"';
  };
  const rows = data.map(function (d) {
    const dateStr = d.date instanceof Date ? d.date.toISOString().split('T')[0] : d.date;
    const dirs = (d.directions || []).join(' | ');
    const stops = (d.stops || []).map(function (s) {
      return s.name + ' (' + [s.tag ? '[' + s.tag + ']' : '', s.price, s.time, s.hours].filter(Boolean).join(', ') + ')';
    }).join('; ');
    const acts = (d.activities || []).map(function (a) {
      return a.text + ' (' + [a.tag ? '[' + a.tag + ']' : '', a.price, a.time, a.hours].filter(Boolean).join(', ') + ')';
    }).join('; ');
    const lodg = Array.isArray(d.lodging)
      ? d.lodging.map(function (l) { return l.tier + ': ' + l.name + ' (' + l.price + ')'; }).join('; ')
      : (d.lodging || '');
    const pois = (d.poi || []).map(function (p) { return p.name + ' [' + p.lat + ',' + p.lng + ']'; }).join('; ');
    return [
      d.day, dateStr, d.base, d.drive || '', d.driveTime || '', dirs,
      d.meals ? d.meals.breakfast : '', d.meals ? d.meals.lunch : '', d.meals ? d.meals.dinner : '',
      stops, acts, d.groupNotes || '', lodg, d.lat, d.lng, pois
    ].map(esc).join(',');
  });
  return '\uFEFF' + headers.map(esc).join(',') + '\r\n' + rows.join('\r\n');
}

let hasErrors = false;
const written = [];

targetFiles.forEach(function (file) {
  const fullPath = path.resolve(repoRoot, file);
  if (!fs.existsSync(fullPath)) {
    console.error('[FAIL] File not found: ' + file);
    hasErrors = true;
    return;
  }

  const html = fs.readFileSync(fullPath, 'utf8');
  const arrayText = extractDataArray(html);
  if (!arrayText) {
    console.error('[FAIL] Could not extract "const data = [...]" block from ' + file);
    hasErrors = true;
    return;
  }

  let data;
  try {
    data = evalData(arrayText);
  } catch (e) {
    console.error('[FAIL] Failed to evaluate data array in ' + file + ': ' + e.message);
    hasErrors = true;
    return;
  }

  if (!Array.isArray(data)) {
    console.error('[FAIL] Extracted data is not an array in ' + file);
    hasErrors = true;
    return;
  }

  // Prefer the export filename declared inside the page so outputs stay in sync.
  let baseName = null;
  const dl = html.match(/a\.download\s*=\s*['"]([^'"]+?)\.json['"]/);
  if (dl) baseName = dl[1];
  if (!baseName) baseName = FALLBACK_OUTPUT[path.basename(file)];
  if (!baseName) {
    console.error('[FAIL] Cannot determine output name for ' + file);
    hasErrors = true;
    return;
  }

  const clean = toCleanData(data);
  const jsonPath = path.join(repoRoot, baseName + '.json');
  const csvPath = path.join(repoRoot, baseName + '.csv');

  fs.writeFileSync(jsonPath, JSON.stringify(clean, null, 2) + '\n', 'utf8');
  fs.writeFileSync(csvPath, toCSV(data), 'utf8');

  written.push({ file: file, baseName: baseName, days: clean.length });
  console.log('[OK] ' + file + ' -> ' + baseName + '.json (' + clean.length + ' days) + ' + baseName + '.csv');
});

console.log('');
if (written.length) {
  console.log('Wrote ' + (written.length * 2) + ' file(s):');
  written.forEach(function (w) {
    console.log('  - ' + w.baseName + '.json');
    console.log('  - ' + w.baseName + '.csv');
  });
}
if (hasErrors) process.exit(1);
