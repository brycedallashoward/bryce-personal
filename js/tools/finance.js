import { load } from '../store.js';

export const label = 'Finance';

export async function render(el) {
  const data = await load('finance');
  if (!data) {
    el.innerHTML = '<p class="empty-state">No finance data yet.</p>';
    return;
  }
  el.innerHTML = `<p class="empty-state">Finance tool coming soon.</p>`;
}
