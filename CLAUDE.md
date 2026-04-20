# bryce-personal

## Project
A personal life-management PWA pinned to Bryce's iPhone homescreen. Acts as a single source of truth for managing daily life — tasks, goals, notes, routines, or whatever evolves over time.

## PWA Requirements
- `manifest.json` with name, icons, `display: standalone`, `theme_color`
- Service worker for offline support
- Mobile-first, optimized for iPhone viewport
- No install prompt needed — user adds via Safari "Add to Home Screen"

## Tech Stack
Minimal by default: plain HTML/CSS/JS unless a framework is clearly warranted. Avoid build tooling overhead for a personal project.

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
