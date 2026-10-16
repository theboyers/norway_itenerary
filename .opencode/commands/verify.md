---
description: Run automated quality, syntax, zero em-dash, icon/tag, and export checks across itinerary files
agent: orchestrator
---

Delegate to `@qa-auditor` to run `node scripts/verify-itineraries.js $ARGUMENTS` and provide a full QA scorecard covering:
1. Zero em dashes (`U+2014` and `HTML mdash entities`).
2. Valid embedded `<script>` JavaScript syntax.
3. 10-day schema, coordinate completeness, and routeExclude flags.
4. Icon and tag distribution across stops and activities.
5. JSON and 16-column CSV export integrity.
