import { store } from '../store.js';

export function getAlolanSprite(pokemonNumber, variantType) {
  const variants = store.variantMap[pokemonNumber] || {};
  const chains = {
    'alolan_shiny_male':   ['alolan_shiny_male',   'alolan_shiny', 'alolan'],
    'alolan_shiny_female': ['alolan_shiny_female',  'alolan_shiny', 'alolan'],
    'alolan_shiny':        ['alolan_shiny',          'alolan'],
    'alolan_male':         ['alolan_male',            'alolan'],
    'alolan_female':       ['alolan_female',          'alolan'],
    'alolan':              ['alolan'],
  };
  for (const fvt of (chains[variantType] || [variantType])) {
    if (variants[fvt]) return variants[fvt];
  }
  return null;
}

export function getGalarianSprite(pokemonNumber, variantType) {
  const variants = store.variantMap[pokemonNumber] || {};
  const chains = {
    'galarian_shiny_male':   ['galarian_shiny_male',   'galarian_shiny', 'galarian'],
    'galarian_shiny_female': ['galarian_shiny_female',  'galarian_shiny', 'galarian'],
    'galarian_shiny':        ['galarian_shiny',          'galarian'],
    'galarian_male':         ['galarian_male',            'galarian'],
    'galarian_female':       ['galarian_female',          'galarian'],
    'galarian':              ['galarian'],
  };
  for (const fvt of (chains[variantType] || [variantType])) {
    if (variants[fvt]) return variants[fvt];
  }
  return null;
}

export function getHisuianSprite(pokemonNumber, variantType) {
  const variants = store.variantMap[pokemonNumber] || {};
  const chains = {
    'hisuian_shiny_male':   ['hisuian_shiny_male',   'hisuian_shiny', 'hisuian'],
    'hisuian_shiny_female': ['hisuian_shiny_female',  'hisuian_shiny', 'hisuian'],
    'hisuian_shiny':        ['hisuian_shiny',          'hisuian'],
    'hisuian_male':         ['hisuian_male',            'hisuian'],
    'hisuian_female':       ['hisuian_female',          'hisuian'],
    'hisuian':              ['hisuian'],
  };
  for (const fvt of (chains[variantType] || [variantType])) {
    if (variants[fvt]) return variants[fvt];
  }
  return null;
}

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
