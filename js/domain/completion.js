import { store } from '../store.js';

export function getVariantStatus(pokemonNumber, variantType) {
  const direct = store.seenMap[pokemonNumber]?.[variantType]?.status;
  if (direct) return direct;
  const seen = store.seenMap[pokemonNumber];
  if (!seen) return '';
  if (variantType === 'normal')
    return seen['male']?.status || seen['female']?.status || '';
  if (variantType === 'male' || variantType === 'female')
    return seen['normal']?.status || '';
  if (variantType === 'shiny')
    return seen['shiny_male']?.status || seen['shiny_female']?.status || '';
  if (variantType === 'shiny_male' || variantType === 'shiny_female')
    return seen['shiny']?.status || '';
  if (variantType === 'alolan')
    return seen['alolan_male']?.status || seen['alolan_female']?.status || '';
  if (variantType === 'alolan_male' || variantType === 'alolan_female')
    return seen['alolan']?.status || '';
  if (variantType === 'alolan_shiny')
    return seen['alolan_shiny_male']?.status || seen['alolan_shiny_female']?.status || '';
  if (variantType === 'alolan_shiny_male' || variantType === 'alolan_shiny_female')
    return seen['alolan_shiny']?.status || '';
  if (variantType === 'galarian')
    return seen['galarian_male']?.status || seen['galarian_female']?.status || '';
  if (variantType === 'galarian_male' || variantType === 'galarian_female')
    return seen['galarian']?.status || '';
  if (variantType === 'galarian_shiny')
    return seen['galarian_shiny_male']?.status || seen['galarian_shiny_female']?.status || '';
  if (variantType === 'galarian_shiny_male' || variantType === 'galarian_shiny_female')
    return seen['galarian_shiny']?.status || '';
  if (variantType === 'hisuian')
    return seen['hisuian_male']?.status || seen['hisuian_female']?.status || '';
  if (variantType === 'hisuian_male' || variantType === 'hisuian_female')
    return seen['hisuian']?.status || '';
  if (variantType === 'hisuian_shiny')
    return seen['hisuian_shiny_male']?.status || seen['hisuian_shiny_female']?.status || '';
  if (variantType === 'hisuian_shiny_male' || variantType === 'hisuian_shiny_female')
    return seen['hisuian_shiny']?.status || '';
  return '';
}
