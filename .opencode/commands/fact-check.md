---
description: Fact-check an itinerary file day by day for driving distances, seasonal openings, hours, prices, and map routing
agent: orchestrator
---

Please coordinate a comprehensive day-by-day fact-check of `$ARGUMENTS` (default to `index.html` if no file is specified):

1. Delegate to `@fact-checker` to audit each of the 10 days for:
   - Driving distances (miles and km), realistic Norwegian drive times, and ferry crossings.
   - Seasonal road and mountain pass openings for May 28 - Jun 6, 2027, plus Sunday closures.
   - Operating hours and USD/NOK pricing for attractions, stops, restaurants, and hotels.
   - Geographical sequence of highway stops and `routeExclude: true` flags for side detours.
2. If any gaps or closed venues are found, delegate to `@researcher` to find verified replacements.
3. Present a clear, structured summary of confirmed facts, discrepancies, and recommended updates before we apply changes.
