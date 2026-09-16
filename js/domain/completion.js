import { store } from '../store.js';

// Formes appariées : une forme neutre et ses deux versions genrées se reflètent
// quand l'une n'a pas de statut propre ('normal' ↔ 'male'/'female', 'alolan_shiny'
// ↔ 'alolan_shiny_male'/'alolan_shiny_female'…), pour la forme de base et chaque
// région. Le neutre renvoie au mâle puis à la femelle ; chaque sexe, au neutre.
const PAIRED_FALLBACKS = new Map();
for (const region of ['', 'alolan', 'galarian', 'hisuian', 'paldean']) {
  const p = region ? `${region}_` : '';
  for (const [neutral, male, female] of [
    [region || 'normal', `${p}male`,       `${p}female`],
    [`${p}shiny`,        `${p}shiny_male`, `${p}shiny_female`],
  ]) {
    PAIRED_FALLBACKS.set(neutral, [male, female]);
    PAIRED_FALLBACKS.set(male,    [neutral]);
    PAIRED_FALLBACKS.set(female,  [neutral]);
  }
}

export function getVariantStatus(pokemonNumber, variantType) {
  if (!variantType) return '';   // garde-fou : un type absent ne doit jamais casser le rendu
  const direct = store.seenMap[pokemonNumber]?.[variantType]?.status;
  if (direct) return direct;
  const seen = store.seenMap[pokemonNumber];
  if (!seen) return '';
  const fallbacks = PAIRED_FALLBACKS.get(variantType);
  if (fallbacks) {
    for (const vt of fallbacks) if (seen[vt]?.status) return seen[vt].status;
    return '';
  }
  // Formes spéciales genrées (Pikachu Partenaire, Deusolourdo…) : le tiroir
  // enregistre « <form_key>[_shiny] » pour le mâle et le même type suffixé
  // « _female » pour la femelle. Chaque carte reflète donc son homologue quand
  // elle n'a pas de statut propre, comme les paires régionales ci-dessus.
  if (variantType.endsWith('_female'))
    return seen[variantType.slice(0, -'_female'.length)]?.status || '';
  return seen[`${variantType}_female`]?.status || '';
}
