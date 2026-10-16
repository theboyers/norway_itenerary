---
description: Research and add new optional stops, activities, and map pins along an itinerary route
agent: orchestrator
---

Please enrich our itinerary with the following request: `$ARGUMENTS`

Follow this workflow:
1. Delegate to `@researcher` to find verified stops, activities, and points of interest along the route corridor with exact WGS84 `lat`/`lng` coordinates, late-May/early-June operating hours, USD/NOK prices, and official URLs.
2. Delegate to `@builder` to integrate the new items into the target HTML file's `data` array (`stops`, `activities`, and `poi`), ensure proper tags and icons (`fa-disc-golf-basket`, `fa-water`, `fa-mountain`, `fa-utensils`, `fa-beer`, `fa-spa`, `fa-dumbbell`), and mark off-highway detours with `routeExclude: true`.
3. Delegate to `@qa-auditor` to run `node scripts/verify-itineraries.js` and confirm zero em dashes, valid JS syntax, and working JSON/CSV exports.
