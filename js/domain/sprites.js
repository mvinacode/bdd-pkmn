import { store } from '../store.js';
import { findVariantSprite } from './sprite-chains.js';

// Alola, Galar et Hisui suivent la chaîne de repli commune (domain/sprite-chains.js).
function getRegionalSprite(pokemonNumber, variantType) {
  return findVariantSprite(store.variantMap[pokemonNumber], variantType);
}

export const getAlolanSprite   = (pokemonNumber, variantType) => getRegionalSprite(pokemonNumber, variantType);
export const getGalarianSprite = (pokemonNumber, variantType) => getRegionalSprite(pokemonNumber, variantType);
export const getHisuianSprite  = (pokemonNumber, variantType) => getRegionalSprite(pokemonNumber, variantType);

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
