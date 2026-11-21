// Règles d'état (vu / obtenu) de la fiche Pokémon : coloration des illustrations
// et des portraits de la chaîne d'évolution. Fonctions pures.
import { formLabelToVariantType } from './form-labels.js';
import { NO_BASE_FORM_NUMBERS } from './constants.js';

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

// Variantes de la forme de base. Chaque autre forme (régionale, méga, gigamax,
// baron, spéciale…) a sa propre illustration et ne colore jamais celle de base.
const BASE_VARIANTS = new Set(['normal', 'asexue', 'male', 'female']);
const BASE_SHINY_VARIANTS = new Set(['shiny', 'asexue_shiny', 'shiny_male', 'shiny_female']);
const isBaseVariant = vt => BASE_VARIANTS.has(vt) || BASE_SHINY_VARIANTS.has(vt);

// Capture de la forme de base : libellé « Normale », « Mâle Shiny », « Asexué »…
// Une ancienne capture sans libellé compte aussi comme forme de base.
function isBaseCatch(c) {
  if (!c) return false;
  return !c.form_label || isBaseVariant(formLabelToVariantType(c.form_label));
}

/**
 * État des deux illustrations (normale, shiny) d'une colonne de la fiche.
 * @param {object} seenForms   { [variant_type]: { status } } du Pokémon affiché
 * @param {object|null} latestCatch
 * @param {{ kind: 'base'|'mega'|'gigamax'|'regional'|'special', region?: string, sfKey?: string,
 *           pokemonNumber?: number }} column  pokemonNumber : requis pour la colonne de base
 * @returns {{ ownedNormal: boolean, seenNormal: boolean, ownedShiny: boolean, seenShiny: boolean }}
 */
export function artworkStatus(seenForms, latestCatch, column) {
  const entries = Object.entries(seenForms || {});
  const any = (match, shiny, status) =>
    entries.some(([vt, d]) => match(vt) && vt.includes('shiny') === shiny && d.status === status);
  // `catchCounts` : une capture (quelle que soit sa forme) vaut « obtenu ».
  const byMatch = (match, catchCounts = null) => ({
    ownedNormal: (!!catchCounts && !catchCounts.is_shiny) || any(match, false, 'owned'),
    seenNormal:  any(match, false, 'seen'),
    ownedShiny:  (!!catchCounts && !!catchCounts.is_shiny) || any(match, true, 'owned'),
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
      // Zarbi, Deusolourdo… : pas de forme « nue », chaque individu est une forme
      // nommée. Leur illustration principale représente l'espèce et reflète donc
      // n'importe laquelle de leurs formes.
      if (NO_BASE_FORM_NUMBERS.has(column.pokemonNumber)) return byMatch(() => true, latestCatch);
      return baseArtworkStatus(entries, latestCatch);
  }
}

function baseArtworkStatus(entries, latestCatch) {
  const base = isBaseCatch(latestCatch);
  const any = (shiny, status) =>
    entries.some(([vt, d]) => isBaseVariant(vt) && BASE_SHINY_VARIANTS.has(vt) === shiny && d.status === status);
  return {
    ownedNormal: (base && !latestCatch.is_shiny) || any(false, 'owned'),
    seenNormal:  any(false, 'seen'),
    ownedShiny:  (base && !!latestCatch.is_shiny) || any(true, 'owned'),
    seenShiny:   any(true, 'seen'),
  };
}
