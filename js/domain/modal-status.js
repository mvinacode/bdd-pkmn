// Règles d'état (vu / obtenu) de la fiche Pokémon : coloration des illustrations
// et des portraits de la chaîne d'évolution. Fonctions pures, reprises telles
// quelles de l'ancien openModal (presentation/modal.js), particularités comprises.
import { ALOLA_FORM_VT, GALAR_FORM_VT, PALDEA_FORM_VT, SPECIAL_FORM_VT } from './constants.js';

/**
 * État d'une forme (méga, gigamax, régionale…) d'un Pokémon de la chaîne d'évolution.
 * @param {object|undefined} seenForms { [variant_type]: { status } } du Pokémon
 * @param {object|null} latestCatch   capture la plus récente du Pokémon
 * @param {string} formType           sous-chaîne du variant_type (ex. 'mega', 'alolan')
 * @returns {'caught'|'seen'|'unseen'}
 */
export function evoFormStatus(seenForms, latestCatch, formType) {
  if (seenForms) {
    if (Object.entries(seenForms).some(([vt, d]) => vt.includes(formType) && d.status === 'owned')) return 'caught';
    if (Object.keys(seenForms).some(vt => vt.includes(formType))) return 'seen';
  }
  const c = latestCatch;
  if (c && (c.variant_type?.includes(formType) || c.form_label?.toLowerCase().includes(formType === 'mega' ? 'méga' : 'gigamax'))) return 'caught';
  return 'unseen';
}

// Formes comptées pour l'illustration de base : ni shiny-ness ni région Alola,
// Galar ou Paldéa (Hisui n'est pas exclu, comme dans l'ancien code).
const isBaseLike = vt => !vt.startsWith('alolan') && !vt.startsWith('galarian') && !vt.startsWith('paldean');

/**
 * Est-ce que la capture la plus récente est une capture de la forme de base ?
 * (Hisui n'est pas exclu, comme dans l'ancien code.)
 */
function isBaseCatch(c) {
  return !!c && !ALOLA_FORM_VT[c.form_label] && !GALAR_FORM_VT[c.form_label] && !PALDEA_FORM_VT[c.form_label]
    && !SPECIAL_FORM_VT[c.form_label] && !/^(Méga|Gigamax|Baron)/.test(c.form_label || '');
}

/**
 * État des deux illustrations (normale, shiny) d'une colonne de la fiche.
 * @param {object} seenForms   { [variant_type]: { status } } du Pokémon affiché
 * @param {object|null} latestCatch
 * @param {{ kind: 'base'|'mega'|'gigamax'|'regional'|'special', region?: string, sfKey?: string }} column
 * @returns {{ ownedNormal: boolean, seenNormal: boolean, ownedShiny: boolean, seenShiny: boolean }}
 */
export function artworkStatus(seenForms, latestCatch, column) {
  const entries = Object.entries(seenForms || {});
  const any = (match, shiny, status) =>
    entries.some(([vt, d]) => match(vt) && vt.includes('shiny') === shiny && d.status === status);
  const byMatch = match => ({
    ownedNormal: any(match, false, 'owned'),
    seenNormal:  any(match, false, 'seen'),
    ownedShiny:  any(match, true, 'owned'),
    seenShiny:   any(match, true, 'seen'),
  });

  switch (column.kind) {
    case 'mega':    return byMatch(vt => vt.includes('mega'));
    case 'gigamax': return byMatch(vt => vt.includes('gigamax'));
    case 'regional': {
      // Chaque colonne régionale porte sa région (ex. paldean_combat) ; repli sur
      // Alola/Galar/Hisui groupés si elle manque.
      const { region } = column;
      return byMatch(vt => region ? vt.startsWith(region)
        : (vt.startsWith('alolan') || vt.startsWith('galarian') || vt.startsWith('hisuian')));
    }
    case 'special':
      if (column.sfKey) {
        const is = (vt, status) => Object.hasOwn(seenForms || {}, vt) && seenForms[vt]?.status === status;
        const shinyKey = column.sfKey + '_shiny';
        return {
          ownedNormal: is(column.sfKey, 'owned'), seenNormal: is(column.sfKey, 'seen'),
          ownedShiny:  is(shinyKey, 'owned'),     seenShiny:  is(shinyKey, 'seen'),
        };
      }
      return baseArtworkStatus(entries, latestCatch);
    default:
      return baseArtworkStatus(entries, latestCatch);
  }
}

function baseArtworkStatus(entries, latestCatch) {
  const base = isBaseCatch(latestCatch);
  const any = (shiny, status) =>
    entries.some(([vt, d]) => vt.includes('shiny') === shiny && isBaseLike(vt) && d.status === status);
  return {
    ownedNormal: (base && !latestCatch.is_shiny) || any(false, 'owned'),
    seenNormal:  any(false, 'seen'),
    ownedShiny:  (base && !!latestCatch.is_shiny) || any(true, 'owned'),
    seenShiny:   any(true, 'seen'),
  };
}
