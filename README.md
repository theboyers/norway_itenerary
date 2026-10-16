# Norway Road Trip 2027 - Multi-Agent OpenCode Itinerary System

Interactive static HTML/CSS/JS site and multi-agent AI workspace for planning a 10-day family road trip across Norway (May 28 - Jun 6, 2027).

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
  - [5. Synchronizing the Master Overview (`index.html`)](#5-synchronizing-the-master-overview-indexhtml)
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
| **`orchestrator`** | `primary` | `opencode-go/kimi-k2.7-code` | Lead Travel Director & Technical PM | Read, Web Search, Task delegation (`edit: deny`) | Analyzes user requests, plans execution, dispatches tasks to subagents, and synthesizes findings into actionable choices. |
| **`researcher`** | `subagent` | `opencode-go/glm-5.3-flash` | Travel & Local Discovery Specialist | Read, Web Search, Web Fetch (`edit: deny`) | Two-pass research: iconic landmarks + off-the-beaten-path hidden gems, bakeries, craft breweries, distilleries, disc golf, saunas, gyms. |
| **`fact-checker`** | `subagent` | `opencode-go/kimi-k2.7-code` | Route Logistics & Accuracy Auditor | Read, Web Search, Read-only scripts (`edit: deny`) | Audits driving distances, Norwegian mountain pass seasonal openings, ferry schedules, Sunday closures, hotel suitability, and pricing. |
| **`builder`** | `subagent` | `opencode-go/kimi-k2.7-code` | Frontend & Map Engineer | Full Read/Edit/Write, Bash/Node | Updates `data` arrays, Leaflet/OSRM maps, `routeExclude: true` detours, custom SVG icons, CSS badge styles, and dark mode. |
| **`qa-auditor`** | `subagent` | `opencode-go/glm-5.3-flash` | Schema & Constraint Verifier | Read, Node verification scripts (`edit: deny`) | Audits files for zero em dashes, valid JS syntax, complete WGS84 coordinates, badge/icon pairings, and JSON/CSV export integrity. |

### OpenCode Go Model Strategy & Cost Efficiency

All agents are configured with the lowest-cost models from the [OpenCode Go catalog](https://opencode.ai/v2/docs/console/go/#usage-limits) that accurately perform each task:

- **`opencode-go/glm-5.3-flash`** (\$0.15 / 1M input, \$0.50 / 1M output, \$0.03 cached read):
  - Assigned to **`researcher`** and **`qa-auditor`**.
  - **Why**: Flash tier model with ultra-fast inference and high accuracy for web parsing, structured entity extraction, and automated test scorecard generation at minimum cost.
- **`opencode-go/kimi-k2.7-code`** (\$0.95 / 1M input, \$4.00 / 1M output, \$0.19 cached read):
  - Assigned to **`orchestrator`**, **`builder`**, and **`fact-checker`**.
  - **Why**: Specialized code and reasoning model. It provides the high accuracy required for AST/DOM code edits to multi-thousand-line single-page HTML files and complex multi-pass routing logic, while costing significantly less than frontier models like Kimi K3 (\$3.00 / \$15.00) or Qwen3.8 Max (\$2.00 / \$6.00).

Both models share the \$60/month standard allowance (\$180/month on Go Plus).

---

## How to Interact with the Agents

When launching OpenCode in this project repository, **`orchestrator`** starts as your default conversational agent.

1. **Talk Directly to the Orchestrator (Recommended)**:
   You interact directly with `orchestrator`. Describe what you want in natural language. The orchestrator plans the steps, delegates to `@researcher`, `@fact-checker`, `@builder`, or `@qa-auditor`, and reports back with results.
2. **Targeted Subagent Mentions (`@agent`)**:
   You can also address any subagent directly in chat using the `@` symbol:
   - `@fact-checker audit Day 7 driving times in itinerary1.html`
   - `@researcher find craft cideries in Hardanger for itinerary2.html`
   - `@builder add the new viewpoints to itinerary3.html Day 4`
   - `@qa-auditor check itinerary1.html for em dashes and JS syntax`
3. **Use Built-in Slash Commands**:
   Type `/` in the prompt box to run automated multi-agent workflows like `/fact-check`, `/enrich`, `/verify`, and `/sync-index`.

---

## Example Queries & Workflows

### 1. Fact-Checking a Route

**Prompting the Orchestrator:**
> "Please fact-check all 10 days of itinerary1.html. Verify the driving times, check if any mountain passes are closed in late May, confirm Sunday operating hours, and give me recommendations on what needs updating."

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
3. `orchestrator` dispatches `@builder` to insert the items into `stops`, `activities`, and `poi` in `itinerary1.html`, setting `routeExclude: true` on side detours so highway polylines remain intact.
4. `orchestrator` dispatches `@qa-auditor` to verify zero em dashes, syntax, and CSV export.

---

### 3. Frontend, Map & Icon Engineering

**Prompting the Orchestrator:**
> "Make sure all disc golf courses display the disc golf basket SVG icon, rafting uses water waves, viewpoints use mountains, food uses utensils, and breweries use beer glasses."

**What Happens:**
1. `orchestrator` tasks `@builder` with updating `renderTagBadge()` and `renderActivityIcon()` in `itinerary1.html`.
2. `@builder` injects the custom inline vector SVG `svgDiscGolfBasket` for `fa-disc-golf-basket` and updates the activities array.
3. `@builder` configures `.badge-tag-scenic`, `.badge-tag-food`, `.badge-tag-gym`, and `.badge-tag-wellness` CSS classes for both light and dark modes.
4. `@qa-auditor` runs validation to ensure icon distribution matches project standards.

---

### 4. Quality Assurance & Verification

**Prompting the Orchestrator:**
> "Run a complete QA audit across itinerary1.html and verify that the JSON and CSV export buttons work without errors."

**What Happens:**
1. `orchestrator` delegates to `@qa-auditor`.
2. `@qa-auditor` executes `node scripts/verify-itineraries.js itinerary1.html`.
3. The auditor checks:
   - Zero em dashes (`U+2014` or `HTML mdash entity`).
   - Valid embedded `<script>` execution via `new Function()`.
   - All 10 days present with valid base coordinates, stops, and POIs.
   - 16-column CSV structure with Norwegian character encoding (`æ, ø, å`).
4. `@qa-auditor` outputs a scorecard back to the chat.

---

### 5. Synchronizing the Master Overview (`index.html`)

**Prompting the Orchestrator:**
> "Synchronize index.html with our latest changes across all route files so the driving times, base counts, and cost estimates match."

**What Happens:**
1. `orchestrator` delegates comparison to `@fact-checker` to calculate base counts (counting only stops between arrival and departure cities) and driving totals.
2. `@builder` updates the route comparison grid and summary statistics in `index.html`.
3. `@qa-auditor` validates syntax and zero em dashes in `index.html`.

---

## Custom Slash Commands

You can run these commands directly in the OpenCode TUI prompt:

| Command | File | Description & Usage |
|---|---|---|
| **`/fact-check`** | `.opencode/commands/fact-check.md` | Audits an itinerary day by day for distances, hours, prices, and seasonal openings.<br>`/fact-check itinerary1.html` |
| **`/enrich`** | `.opencode/commands/enrich.md` | Dispatches `@researcher` -> `@builder` -> `@qa-auditor` to find and add new activities.<br>`/enrich itinerary1.html disc golf courses and saunas in Flåm` |
| **`/verify`** | `.opencode/commands/verify.md` | Executes automated syntax, zero em-dash, coordinate, and export checks.<br>`/verify itinerary1.html` |
| **`/sync-index`** | `.opencode/commands/sync-index.md` | Audits and updates `index.html` route cards, driving stats, and base counts.<br>`/sync-index` |

---

## Technical Conventions & Project Rules

All agents and contributors must strictly adhere to the following rules:

1. **Zero Em Dashes**: Never use the em dash character (`U+2014` or HTML entity `HTML mdash entity`) anywhere in project files. Always use standard hyphens with spaces (` - `), colons, or parentheses.
2. **Privacy**: Never output personal family member names into any HTML, JSON, or CSV file. All itineraries present neutral options.
3. **Pacing Constraints**:
   - Exactly 10 days total (May 28 - Jun 6, 2027).
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
   All itinerary pages render from a central `const data = [...]` array containing 10 day objects. The `colors` array must be declared before any code that references it.

---

## Automated Verification Scripts

A zero-dependency verification CLI is included at `scripts/verify-itineraries.js`.

To verify specific files:
```bash
node scripts/verify-itineraries.js itinerary1.html index.html
```

To verify all itinerary files across the project:
```bash
node scripts/verify-itineraries.js
```

The script automatically validates:
- Zero em dashes (`U+2014` and `HTML mdash entity`).
- Embedded `<script>` syntax compilation (`new Function()`).
- Data array completeness (10 days, WGS84 coordinates on bases, stops, and POIs).
- Tag and icon distribution metrics.
