# bryce-personal

## Project
A personal life-management PWA pinned to Bryce's iPhone homescreen. Acts as a single source of truth for managing daily life — organized in **seasons**, each with its own tools and goals that contribute to a longer-term vision.

## PWA Requirements
- `manifest.json` with name, icons, `display: standalone`, `theme_color`
- Service worker for offline support
- Mobile-first, optimized for iPhone viewport
- No install prompt needed — user adds via Safari "Add to Home Screen"

## Tech Stack
Minimal: plain HTML/CSS/JS. No build tooling. Each tool is a JS module. Routing is hash-based (`#/tool-name`).

## Architecture

### Layers
1. **App shell** (`index.html`, `js/app.js`) — persistent nav, season indicator, hash router
2. **Season** (`seasons/<season>.js`) — config: name, date range, active tools, vision note, theme
3. **Tool** (`js/tools/<tool>.js`) — a self-contained mini-experience; reads from its data file, renders into the shell

### Data Model
Tools never call external APIs. Data lives in versioned JSON files that Claude maintains:
```
data/
├── preferences.json  # User preferences (Claude updates when Bryce states one)
├── finance.json      # Financial snapshot (Claude-refreshed)
├── fitness.json      # Workout log (Claude-assisted entry)
└── vision.json       # Cross-season goals and progress
```
**Claude is the ETL layer.** When the user asks for a data refresh (or on a cadence), Claude calls the relevant connector, transforms the result, writes to the appropriate JSON file, commits, and pushes. The PWA reads static files — no OAuth, no live API calls from the browser.

### Preferences
`data/preferences.json` is the canonical record of stated preferences. **When Bryce states a preference during any session, Claude must update this file and commit it.** This ensures preferences persist across sessions and devices rather than living only in Claude's context window. Current preferences:
- `theme`: `"light"` — light mode is the default; dark mode only in specific justified contexts
- `fitnessGoal`: `"4x / week"`

### Cross-Season Vision
`data/vision.json` sits above seasons — persistent goals that individual seasons make progress toward. Each season references relevant vision items.

### Seasonal Theming
`css/base.css` holds shared design tokens. Each season can override via `css/<season>.css`.

## File Structure
```
bryce-personal/
├── index.html
├── manifest.json
├── sw.js
├── css/
│   ├── base.css
│   └── spring-2026.css
├── js/
│   ├── app.js          # Shell, router, season loading
│   ├── store.js        # fetch('/data/*.json') abstraction
│   └── tools/
│       ├── fitness.js
│       └── finance.js
├── seasons/
│   └── spring-2026.js  # Season config
└── data/
    ├── preferences.json
    ├── vision.json
    ├── fitness.json
    └── finance.json
```

## Seasons
- **Spring 2026** (current): Fitness/gym consistency, financial foundation (new job May 2nd)

## Dev
Open `index.html` directly in a browser for quick iteration, or use a local server:
```
npx serve .
# or
python3 -m http.server 8080
```

## Git
- Branch: `claude/web-interface-setup-CJqEC` (development)
- Commit and push at the end of each session so work is accessible from any environment (Mac or web)
