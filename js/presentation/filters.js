import { TYPE_FR } from '../domain/constants.js';
import { fetchTypes } from '../supabase-client.js';

export async function populateTypeFilters() {
  const el = document.getElementById('type-filters');
  if (!el) return;
  const types = await fetchTypes();
  types.forEach(typeName => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.dataset.type = typeName;
    btn.textContent  = TYPE_FR[typeName] || typeName;
    el.appendChild(btn);
  });
}
