#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

const targetFiles = args.length > 0
  ? args
  : fs.readdirSync(repoRoot).filter(f => /^itinerary\d+\.html$|^index\.html$/.test(f)).sort();

let hasErrors = false;

targetFiles.forEach(file => {
  const fullPath = path.resolve(repoRoot, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`[FAIL] File not found: ${file}`);
    hasErrors = true;
    return;
  }

  const html = fs.readFileSync(fullPath, 'utf8');
  const issues = [];

  // 1. Check for em dashes (Unicode U+2014 or &mdash;)
  const emDashes = html.match(/[\u2014]|&mdash;/g);
  if (emDashes && emDashes.length > 0) {
    issues.push(`Found ${emDashes.length} prohibited em dash(es)`);
  }

  // 2. Check embedded script syntax
  const mainScriptMatch = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/i);
  if (mainScriptMatch) {
    try {
      new Function(mainScriptMatch[1]);
    } catch (err) {
      issues.push(`JavaScript syntax error in <script>: ${err.message}`);
    }
  } else {
    issues.push('Could not locate main <script> block before </body>');
  }

  // 3. If itinerary file, audit the data array
  let metrics = null;
  if (/^itinerary\d+\.html$/.test(path.basename(file))) {
    const dataMatch = html.match(/const data = (\[[\s\S]*?\]);\s*\r?\n\s*\/\/ Colors per day/);
    if (!dataMatch) {
      issues.push('Could not extract "const data = [...]" block');
    } else {
      try {
        const data = eval(dataMatch[1]);
        if (!Array.isArray(data) || data.length !== 10) {
          issues.push(`Expected 10 days in data array, found ${Array.isArray(data) ? data.length : 'non-array'}`);
        }

        let totalStops = 0;
        let totalActivities = 0;
        let totalPois = 0;
        const tagCounts = {};
        const iconCounts = {};

        data.forEach(d => {
          if (typeof d.lat !== 'number' || typeof d.lng !== 'number') {
            issues.push(`Day ${d.day} missing valid base lat/lng`);
          }
          (d.stops || []).forEach(s => {
            totalStops++;
            if (s.tag) tagCounts[s.tag] = (tagCounts[s.tag] || 0) + 1;
          });
          (d.activities || []).forEach(a => {
            totalActivities++;
            if (a.tag) tagCounts[a.tag] = (tagCounts[a.tag] || 0) + 1;
            if (a.icon) iconCounts[a.icon] = (iconCounts[a.icon] || 0) + 1;
          });
          (d.poi || []).forEach(p => {
            totalPois++;
            if (typeof p.lat !== 'number' || typeof p.lng !== 'number') {
              issues.push(`Day ${d.day} POI "${p.name}" missing valid lat/lng`);
            }
          });
        });

        metrics = { days: data.length, totalStops, totalActivities, totalPois, tagCounts, iconCounts };
      } catch (e) {
        issues.push(`Failed to evaluate data array: ${e.message}`);
      }
    }
  }

  if (issues.length > 0) {
    hasErrors = true;
    console.log(`\n[FAIL] ${file}`);
    issues.forEach(iss => console.log(`  - ${iss}`));
  } else {
    console.log(`\n[PASS] ${file} (0 em dashes, valid JS syntax)`);
  }

  if (metrics) {
    console.log(`  Days: ${metrics.days} | Stops: ${metrics.totalStops} | Activities: ${metrics.totalActivities} | POIs: ${metrics.totalPois}`);
    if (Object.keys(metrics.tagCounts).length > 0) {
      console.log(`  Tags: ${JSON.stringify(metrics.tagCounts)}`);
    }
  }
});

if (hasErrors) {
  process.exit(1);
}
