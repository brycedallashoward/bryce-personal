import { load } from '../store.js';

export const label = 'Fitness';

export async function render(el) {
  const data = await load('fitness');
  if (!data) {
    el.innerHTML = '<p class="empty-state">No fitness data.</p>';
    return;
  }

  const sessions = (data.sessions || []).sort((a, b) => b.date.localeCompare(a.date));
  const goal = parseGoal(data.goal);

  el.innerHTML = `
    ${weekCard(sessions, goal)}
    ${historyCard(sessions)}
  `;
}

function parseGoal(str) {
  const m = (str || '').match(/(\d+)/);
  return m ? parseInt(m[1]) : 4;
}

function weekCard(sessions, goal) {
  const today = new Date();
  const monday = startOfWeek(today);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const thisWeek = sessions.filter(s => {
    const d = parseDate(s.date);
    return d >= monday && d <= today;
  });

  const workedOutDays = new Set(thisWeek.map(s => dayIndex(parseDate(s.date), monday)));
  const count = thisWeek.length;
  const pct = Math.min(count / goal, 1);

  const dots = days.map((d, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const isToday = sameDay(date, today);
    const done = workedOutDays.has(i);
    const future = date > today;
    return `<div class="day-dot ${done ? 'done' : ''} ${isToday ? 'today' : ''} ${future ? 'future' : ''}">
      <span class="day-label">${d}</span>
      <span class="day-circle"></span>
    </div>`;
  }).join('');

  const barWidth = Math.round(pct * 100);
  const statusText = count >= goal
    ? `Goal hit this week`
    : `${count} of ${goal} this week`;

  return `
    <div class="card">
      <div class="card-title">This Week</div>
      <div class="fit-week-dots">${dots}</div>
      <div class="fit-progress-bar"><div class="fit-progress-fill" style="width:${barWidth}%"></div></div>
      <div class="fit-status">${statusText}</div>
    </div>
  `;
}

function historyCard(sessions) {
  if (!sessions.length) {
    return `<div class="card"><div class="card-title">Sessions</div><p class="empty-state" style="padding:20px 0">No sessions logged yet.<br>Tell Claude to log one.</p></div>`;
  }

  const rows = sessions.slice(0, 12).map(s => {
    const d = parseDate(s.date);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return `
      <div class="session-row">
        <div class="session-left">
          <div class="session-type">${s.type || 'Gym'}</div>
          <div class="session-date">${dateStr}${s.notes ? ` · ${s.notes}` : ''}</div>
        </div>
        ${s.duration ? `<div class="session-duration">${s.duration}m</div>` : ''}
      </div>
    `;
  }).join('');

  const total = sessions.length;
  const weeksHit = countWeeksHit(sessions, 4);

  return `
    <div class="card">
      <div class="card-title">Sessions</div>
      ${rows}
    </div>
    <div class="fit-stats">
      <div class="fit-stat"><div class="fit-stat-val">${total}</div><div class="fit-stat-label">Total sessions</div></div>
      <div class="fit-stat"><div class="fit-stat-val">${weeksHit}</div><div class="fit-stat-label">Weeks at goal</div></div>
    </div>
  `;
}

function countWeeksHit(sessions, goal) {
  const byWeek = {};
  for (const s of sessions) {
    const d = parseDate(s.date);
    const key = startOfWeek(d).toISOString().slice(0, 10);
    byWeek[key] = (byWeek[key] || 0) + 1;
  }
  return Object.values(byWeek).filter(n => n >= goal).length;
}

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dayIndex(date, monday) {
  return Math.round((date - monday) / 86400000);
}

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
