import { store } from '../store.js';

// Alola, Galar et Hisui partagent les mêmes chaînes de repli, seul le préfixe
// de région change (`alolan`, `galarian`, `hisuian`).
function getRegionalSprite(region, pokemonNumber, variantType) {
  const r = region;
  const variants = store.variantMap[pokemonNumber] || {};
  const chains = {
    [`${r}_shiny_male`]:   [`${r}_shiny_male`,   `${r}_shiny`, r],
    [`${r}_shiny_female`]: [`${r}_shiny_female`, `${r}_shiny`, r],
    [`${r}_shiny`]:        [`${r}_shiny`, `${r}_asexue_shiny`, r, `${r}_asexue`],
    [`${r}_male`]:         [`${r}_male`,   r],
    [`${r}_female`]:       [`${r}_female`, r],
    [r]:                   [r, `${r}_asexue`],
  };
  for (const fvt of (chains[variantType] || [variantType])) {
    if (variants[fvt]) return variants[fvt];
  }
  return null;
}

export const getAlolanSprite   = (pokemonNumber, variantType) => getRegionalSprite('alolan',   pokemonNumber, variantType);
export const getGalarianSprite = (pokemonNumber, variantType) => getRegionalSprite('galarian', pokemonNumber, variantType);
export const getHisuianSprite  = (pokemonNumber, variantType) => getRegionalSprite('hisuian',  pokemonNumber, variantType);

export function getPaldeanSprite(pokemonNumber, variantType) {
  const variants = store.variantMap[pokemonNumber] || {};
  if (variants[variantType]) return variants[variantType];
  // Shiny absent du variantMap => repli sur la forme non-shiny de la même race.
  if (variantType.endsWith('_shiny')) {
    const base = variantType.slice(0, -6);
    if (variants[base]) return variants[base];
  }
  return null;
}

export function getSpecialFormSprite(pokemonNumber, variantType) {
  const isShiny = variantType.endsWith('_shiny');
  const formKey = isShiny ? variantType.slice(0, -6) : variantType;
  const form = store.specialFormsMap[pokemonNumber]?.[formKey];
  if (!form) return null;
  return isShiny ? (form.image_url_shiny || form.image_url) : form.image_url;
}
