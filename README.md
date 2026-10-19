# Norway Road Trip 2027 - Multi-Agent OpenCode Itinerary System

Interactive static HTML/CSS/JS site and multi-agent AI workspace for planning an 11-day family road trip across Norway (May 28 - Jun 7, 2027).

The project features an automated OpenCode multi-agent architecture. A central **Orchestrator** coordinates specialized subagents to discover attractions, fact-check driving logistics and seasonal schedules, build interactive Leaflet maps and data arrays, and run automated QA checks.

---

## Table of Contents

- [Project Architecture](#project-architecture)
- [Agent Roster & Responsibilities](#agent-roster--responsibilities)
- [How to Interact with the Agents](#how-to-interact-with-the-agents)
- [Example Queries & Workflows](#example-queries--workflows)
  - [1. Fact-Checking a Route](#1-fact-checking-a-route)
  - [2. Researching & Adding New Activities](#2-researching--adding-new-activities)
  - [3. Frontend, Map & Icon Engineering](#3-frontend-map--icon-engineering)
  - [4. Quality Assurance & Verification](#4-quality-assurance--verification)
- [Custom Slash Commands](#custom-slash-commands)
- [Technical Conventions & Project Rules](#technical-conventions--project-rules)
- [Automated Verification Scripts](#automated-verification-scripts)

---

## Project Architecture

```
                       +-------------------------------+
                       |         orchestrator          |  (mode: primary)
                       |     Lead Travel & Tech PM     |  Direct user chat interface
                       +---------------+---------------+
                                       |
                   Delegates tasks via OpenCode Task Tool
                                       |
        +------------------+-----------+-----------+-------------------+
        |                  |                       |                   |
        v                  v                       v                   v
+---------------+  +---------------+       +---------------+   +---------------+
|  researcher   |  | fact-checker  |       |    builder    |   |  qa-auditor   |
|  (subagent)   |  |  (subagent)   |       |  (subagent)   |   |  (subagent)   |
| Web Discovery |  | Logistics &   |       | HTML/CSS/JS & |   | Syntax, Schema|
| & Hidden Gems |  | Pricing Audit |       | Leaflet Maps  |   | & Export QA   |
+---------------+  +---------------+       +---------------+   +---------------+
```

All agent configurations live in `.opencode/agents/` and `.opencode/commands/`, registered globally via `opencode.json`.

---

## Agent Roster & Responsibilities

| Agent Identifier | Mode | Assigned Model | Role | Key Tools & Permissions | Primary Responsibilities |
|---|---|---|---|---|---|
| **`orchestrator`** | `primary` | `opencode-go/deepseek-v4.1-flash` | Lead Travel Director & Technical PM | Read, Web Search, Task delegation (`edit: deny`) | Analyzes user requests, plans execution, dispatches tasks to subagents, and synthesizes findings into actionable choices. |
| **`researcher`** | `subagent` | `opencode-go/mimo-v2.6-flash` | Travel & Local Discovery Specialist | Read, Web Search, Web Fetch (`edit: deny`) | Two-pass research: iconic landmarks + off-the-beaten-path hidden gems, bakeries, craft breweries, distilleries, disc golf, saunas, gyms. |
| **`fact-checker`** | `subagent` | `opencode-go/deepseek-v4.1-flash` | Route Logistics & Accuracy Auditor | Read, Web Search, Read-only scripts (`edit: deny`) | Audits driving distances, Norwegian mountain pass seasonal openings, ferry schedules, Sunday closures, hotel suitability, and pricing. |
| **`builder`** | `subagent` | `opencode-go/qwen3.7-plus` | Frontend & Map Engineer | Full Read/Edit/Write, Bash/Node | Updates `data` arrays, Leaflet/OSRM maps, `routeExclude: true` detours, custom SVG icons, CSS badge styles, and dark mode. |
| **`qa-auditor`** | `subagent` | `opencode-go/longcat-2.5-preview-free` | Schema & Constraint Verifier | Read, Node verification scripts (`edit: deny`) | Audits files for zero em dashes, valid JS syntax, complete WGS84 coordinates, badge/icon pairings, citations, and JSON/CSV export integrity. |

### OpenCode Go Model Strategy & Cost Efficiency

All agents are configured with the highest-efficiency models from the [OpenCode Go catalog](https://opencode.ai/v2/docs/console/go/#usage-limits) to maximize request allowances and minimize token costs (especially cached read tokens on 245 KB HTML files):

- **`opencode-go/deepseek-v4.1-flash`** (\$0.15-\$0.30 / 1M input, \$0.60-\$1.20 / 1M output, \$0.003-\$0.006 cached read | **\$80/mo limit**):
  - Assigned to **`orchestrator`** and **`fact-checker`**.
  - **Why**: Offers the highest monthly allowance on OpenCode Go (\$80, ~346,670 requests/month), 0-day data retention (ZDR), and strong tool-calling and analytical reasoning for routing and Norwegian logistics verification.
- **`opencode-go/qwen3.7-plus`** (\$0.40 / 1M input, \$1.60 / 1M output, \$0.04 cached read | **\$60/mo limit**):
  - Assigned to **`builder`**.
  - **Why**: Flat pricing up to **256K tokens** (easily accommodating full single-page HTML files), 0-day data retention, and high coding accuracy for nested JavaScript data arrays at 60-79% lower cost than `kimi-k2.7-code`.
- **`opencode-go/mimo-v2.6-flash`** (\$0.14 / 1M input, \$0.28 / 1M output, \$0.0028 cached read | **\$60/mo limit**):
  - Assigned to **`researcher`**.
  - **Why**: Ultra-fast web parsing and structured JSON extraction at \$0.0028/1M cached reads (~300,800 requests/month) with 0-day data retention.
- **`opencode-go/longcat-2.5-preview-free`** (**Free** input/output/cached | **Unlimited**):
  - Assigned to **`qa-auditor`**.
  - **Why**: Zero-cost model with 0-day data retention for running deterministic Node QA scripts (`node scripts/verify-itineraries.js`) and formatting pass/fail scorecards.

---

## How to Interact with the Agents

When launching OpenCode in this project repository, **`orchestrator`** starts as your default conversational agent.

1. **Talk Directly to the Orchestrator (Recommended)**:
   You interact directly with `orchestrator`. Describe what you want in natural language. The orchestrator plans the steps, delegates to `@researcher`, `@fact-checker`, `@builder`, or `@qa-auditor`, and reports back with results.
2. **Targeted Subagent Mentions (`@agent`)**:
   You can also address any subagent directly in chat using the `@` symbol:
   - `@fact-checker audit Day 7 driving times in index.html`
   - `@researcher find craft cideries in Hardanger for index.html`
   - `@builder add the new viewpoints to index.html Day 4`
   - `@qa-auditor check index.html for em dashes and JS syntax`
3. **Use Built-in Slash Commands**:
   Type `/` in the prompt box to run automated multi-agent workflows like `/fact-check`, `/enrich`, and `/verify`.

---

## Example Queries & Workflows

### 1. Fact-Checking a Route

**Prompting the Orchestrator:**
> "Please fact-check all 11 days of index.html. Verify the driving times, check if any mountain passes are closed in late May, confirm Sunday operating hours, and give me recommendations on what needs updating."

**What Happens:**
1. `orchestrator` invokes `@fact-checker` to inspect driving distances (E16, Rv52, Rv5, Rv15, E6), ferry crossings (Fodnes-Mannheller), and late-May mountain pass conditions (Rv55 Sognefjellet, Strynefjellet).
2. `@fact-checker` flags any closed roads, unrealistic driving estimates, or Sunday store closures, recommending verified adjustments.
3. `orchestrator` presents a clean summary table of findings and asks for your preferred option before applying changes.

---

### 2. Researching & Adding New Activities

**Prompting the Orchestrator:**
> "Search for craft breweries, historic distilleries, disc golf courses, and thermal spas along Route 1 between Loen and Lillehammer, and add them to Day 7 as optional stops."

**What Happens:**
1. `orchestrator` delegates discovery to `@researcher`, searching UDisc courses (e.g., *Medalen Diskgolfbane*), craft breweries (*Lomb Bryggeri*), historic brown cheese dairies (*Heidal Ysteri*), and aquatic spas (*Jorekstad Fritidsbad*).
2. `@researcher` returns structured JSON objects with exact WGS84 coordinates, late-May operating hours, USD and NOK prices, and citation URLs.
3. `orchestrator` dispatches `@builder` to insert the items into `stops`, `activities`, and `poi` in `index.html`, setting `routeExclude: true` on side detours so highway polylines remain intact.
4. `orchestrator` dispatches `@qa-auditor` to verify zero em dashes, syntax, and CSV export.

---

### 3. Frontend, Map & Icon Engineering

**Prompting the Orchestrator:**
> "Make sure all disc golf courses display the disc golf basket SVG icon, rafting uses water waves, viewpoints use mountains, food uses utensils, and breweries use beer glasses."

**What Happens:**
1. `orchestrator` tasks `@builder` with updating `renderTagBadge()` and `renderActivityIcon()` in `index.html`.
2. `@builder` injects the custom inline vector SVG `svgDiscGolfBasket` for `fa-disc-golf-basket` and updates the activities array.
3. `@builder` configures `.badge-tag-scenic`, `.badge-tag-food`, `.badge-tag-gym`, and `.badge-tag-wellness` CSS classes for both light and dark modes.
4. `@qa-auditor` runs validation to ensure icon distribution matches project standards.

---

### 4. Quality Assurance & Verification

**Prompting the Orchestrator:**
> "Run a complete QA audit across index.html and verify that the JSON and CSV export buttons work without errors."

**What Happens:**
1. `orchestrator` delegates to `@qa-auditor`.
2. `@qa-auditor` executes `node scripts/verify-itineraries.js index.html`.
3. The auditor checks:
   - Zero em dashes (`U+2014` or `HTML mdash entity`).
   - Valid embedded `<script>` execution via `new Function()`.
   - All 11 days present with valid base coordinates, stops, and POIs.
   - 16-column CSV structure with Norwegian character encoding (`æ, ø, å`).
4. `@qa-auditor` outputs a scorecard back to the chat.

---

## Custom Slash Commands

You can run these commands directly in the OpenCode TUI prompt:

| Command | File | Description & Usage |
|---|---|---|
| **`/fact-check`** | `.opencode/commands/fact-check.md` | Audits an itinerary day by day for distances, hours, prices, and seasonal openings.<br>`/fact-check index.html` |
| **`/enrich`** | `.opencode/commands/enrich.md` | Dispatches `@researcher` -> `@builder` -> `@qa-auditor` to find and add new activities.<br>`/enrich index.html disc golf courses and saunas in Flåm` |
| **`/verify`** | `.opencode/commands/verify.md` | Executes automated syntax, zero em-dash, coordinate, and export checks.<br>`/verify index.html` |

---

## Technical Conventions & Project Rules

All agents and contributors must strictly adhere to the following rules:

1. **Zero Em Dashes**: Never use the em dash character (`U+2014` or HTML entity `HTML mdash entity`) anywhere in project files. Always use standard hyphens with spaces (` - `), colons, or parentheses.
2. **Privacy**: Never output personal family member names into any HTML, JSON, or CSV file. All itineraries present neutral options.
3. **Pacing Constraints**:
   - Exactly 11 days total (May 28 - Jun 7, 2027).
   - Maximum 4 major driving days.
   - Moderate driving days (2-5h) with stops every 1-2 hours.
   - Every day ends with relaxation (spa, sauna, scenic dinner, or cozy pub).
   - No hostels: all lodging consists of hotels, boutique lodges, or upscale cabins.
4. **Highway Routing & Detours**:
   - On driving days (`d.drive !== null`), intermediate stops listed in `d.stops` are fed into OSRM routing in array order.
   - Any side detour off the highway corridor must have `routeExclude: true` so the route polyline stays on the main highway.
5. **Icon Standards**:
   - `fa-disc-golf-basket` (custom vector SVG): Disc golf courses
   - `fa-water`: Rafting, kayaking, and water wave activities
   - `fa-mountain`: Overlooks, summits, viewpoints, and scenic passes
   - `fa-utensils`: Restaurants, artisan bakeries, cafes, cheese dairies, and food markets
   - `fa-beer`: Breweries, brewpubs, cideries, distilleries, and aquavit tastings
   - `fa-spa` / `fa-hot-tub`: Day spas, thermal baths, and floating saunas
   - `fa-dumbbell`: Gyms and fitness centers
6. **Data Array Schema**:
   All itinerary pages render from a central `const data = [...]` array containing 11 day objects. The `colors` array must be declared before any code that references it.
7. **Mandatory Source Links & Citations**:
   Every stop, activity, and lodging recommendation must include a verified `cite: "https://..."` URL pointing to an official website or authoritative directory (Visit Norway, UDisc, UT.no, Google Maps). Unlinked entries are strictly prohibited.
8. **Authoritative Fact-Checking**:
   Fact-checking audits must consult official Norwegian sources: Statens vegvesen (`vegvesen.no/trafikk`) for mountain pass openings and roads, Fjord1 / Norled / Entur for ferries, Vy for trains, and UT.no (DNT) for hiking trails.

---

## Automated Verification Scripts

A zero-dependency verification CLI is included at `scripts/verify-itineraries.js`.

To verify specific files:
```bash
node scripts/verify-itineraries.js index.html
```

To verify all itinerary files across the project:
```bash
node scripts/verify-itineraries.js
```

The script automatically validates:
- Zero em dashes (`U+2014` and `HTML mdash entity`).
- Embedded `<script>` syntax compilation (`new Function()`).
- Data array completeness (11 days, WGS84 coordinates on bases, stops, and POIs).
- Citation coverage metrics and valid URL schemes (`http://` or `https://`).
- Tag and icon distribution metrics.
