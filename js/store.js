const cache = {};

export async function load(key) {
  if (cache[key]) return cache[key];
  const res = await fetch(`/data/${key}.json`);
  if (!res.ok) return null;
  cache[key] = await res.json();
  return cache[key];
}

export function bust(key) {
  delete cache[key];
}
