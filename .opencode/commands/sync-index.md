---
description: Synchronize route summaries, driving totals, bases count, and highlights in index.html with all itinerary files
agent: orchestrator
---

Please synchronize `index.html` with the current state of `itinerary1.html` through `itinerary6.html`:

1. Delegate to `@fact-checker` to compare each route's bases count (counting only stops between arrival and departure cities), total driving hours, day-by-day summary strip, and cost estimates in `index.html` against the individual `itineraryN.html` files.
2. Delegate to `@builder` to update any out-of-sync route cards, comparison tables, or map markers in `index.html`.
3. Delegate to `@qa-auditor` to verify zero em dashes and valid syntax in `index.html`.
