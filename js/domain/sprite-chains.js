// Ordre de repli pour trouver le sprite d'un variant_type dans pokemon_variants :
// si la variante exacte n'a pas d'image, on essaie les suivantes. Pure, partagée
// par les cartes (domain/sprites.js) et le journal.

const REGIONS = ['alolan', 'galarian', 'hisuian', 'paldean'];

// Une forme régionale peut être neutre (`galarian`), asexuée (`galarian_asexue`,
// ex. Artikodin de Galar) ou seulement genrée (`hisuian_male`, ex. Farfuret).
function regionalChains(r) {
  return {
    [`${r}_shiny_male`]:   [`${r}_shiny_male`,   `${r}_shiny`, r],
    [`${r}_shiny_female`]: [`${r}_shiny_female`, `${r}_shiny`, r],
    [`${r}_shiny`]:        [`${r}_shiny`, `${r}_asexue_shiny`, r, `${r}_asexue`],
    [`${r}_male`]:         [`${r}_male`,   r],
    [`${r}_female`]:       [`${r}_female`, r],
    [r]:                   [r, `${r}_asexue`],
  };
}

// 'asexue'/'asexue_shiny' : icône de base des Pokémon asexués (le libellé
// « Asexué » donne 'normal', mais l'icône est stockée sous 'asexue').
const BASE       = ['normal', 'asexue', 'male', 'female'];
const BASE_SHINY = ['shiny', 'asexue_shiny', 'shiny_male', 'shiny_female', ...BASE];

const CHAINS = {
  ...Object.assign({}, ...REGIONS.map(regionalChains)),
  'shiny_male':   ['shiny_male',   'shiny'],
  'shiny_female': ['shiny_female', 'shiny'],
  'shiny':        ['shiny',  'asexue_shiny'],
  'male':         ['male',   'normal'],
  'female':       ['female', 'normal'],
  'normal':       ['normal', 'asexue'],
  // Méga, Gigamax et Baron → sprite de base du Pokémon, pas un sprite spécial
  'mega':    BASE, 'shiny_mega':    BASE_SHINY,
  'mega_x':  BASE, 'shiny_mega_x':  BASE_SHINY,
  'mega_y':  BASE, 'shiny_mega_y':  BASE_SHINY,
  'gigamax': BASE, 'shiny_gigamax': BASE_SHINY,
  'baron':   BASE, 'shiny_baron':   BASE_SHINY,
  'troizepy_shiny': ['troizepy_shiny', 'troizepy'],
};

/** @returns {string[]} les variant_type à essayer, dans l'ordre */
export function spriteFallbackChain(variantType) {
  if (Object.hasOwn(CHAINS, variantType)) return CHAINS[variantType];
  // Races de Tauros (paldean_combat_shiny…) : shiny absent => même race non shiny.
  if (/^paldean_[a-z]+_shiny$/.test(variantType)) return [variantType, variantType.slice(0, -'_shiny'.length)];
  return [variantType];
}

/** Premier sprite trouvé dans `variants` ({ variant_type: url }) en suivant la chaîne. */
export function findVariantSprite(variants, variantType) {
  for (const vt of spriteFallbackChain(variantType)) if (variants?.[vt]) return variants[vt];
  return null;
}
