import { load } from '../store.js';

export const label = 'Fitness';

export async function render(el) {
  const data = await load('fitness');
  if (!data) {
    el.innerHTML = '<p class="empty-state">No fitness data yet.</p>';
    return;
  }
  el.innerHTML = `<p class="empty-state">Fitness tool coming soon.</p>`;
}
