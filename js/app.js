import season from '../seasons/spring-2026.js';
import * as fitness from './tools/fitness.js';
import * as finance from './tools/finance.js';

const tools = { fitness, finance };

function applyTheme(theme) {
  const existing = document.getElementById('season-theme');
  if (existing) existing.remove();
  const link = document.createElement('link');
  link.id = 'season-theme';
  link.rel = 'stylesheet';
  link.href = `/css/${theme}.css`;
  document.head.appendChild(link);
}

function buildNav(activeTool) {
  const nav = document.getElementById('shell-nav');
  nav.innerHTML = season.tools.map(t =>
    `<a href="#/${t.id}" class="${t.id === activeTool ? 'active' : ''}">${t.label}</a>`
  ).join('');
}

async function route() {
  const hash = location.hash.replace('#/', '') || season.tools[0].id;
  const tool = tools[hash];
  buildNav(hash);
  const content = document.getElementById('shell-content');
  content.innerHTML = '';
  if (tool) {
    await tool.render(content);
  } else {
    content.innerHTML = '<p class="empty-state">Tool not found.</p>';
  }
}

function init() {
  document.getElementById('season-label').textContent = season.name;
  applyTheme(season.theme);
  window.addEventListener('hashchange', route);
  route();
}

init();
